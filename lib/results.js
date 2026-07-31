const documentTypes = new Set(["Degree", "Academic Transcript", "Skill Development Certificate"]);
const statuses = new Set(["Pass", "Distinction", "First Division", "Second Division", "Completed"]);

export function cleanText(value, maximum = 160) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maximum);
}

export function normalizeIdentifier(value) {
  return cleanText(value, 80).replace(/\s+/g, "").toUpperCase();
}

function numericText(value, maximum, label) {
  const text = cleanText(value, 12);
  if (text && (!/^\d{1,3}(?:\.\d{1,2})?$/.test(text) || Number(text) > maximum)) {
    throw new Error(`${label} must be a number from 0 to ${maximum}.`);
  }
  return text;
}

function parseTerms(value) {
  const source = Array.isArray(value) ? value : [];
  if (source.length > 12) throw new Error("A transcript can contain no more than 12 terms.");

  let totalCourses = 0;
  const terms = source.map((term, termIndex) => {
    const inputCourses = Array.isArray(term?.courses) ? term.courses : [];
    if (inputCourses.length > 30) throw new Error("Each term can contain no more than 30 courses.");
    totalCourses += inputCourses.length;

    return {
      label: cleanText(term?.label, 40) || `Term ${termIndex + 1}`,
      tgpa: numericText(term?.tgpa, 10, "TGPA"),
      percentage: numericText(term?.percentage, 100, "Equivalent percentage"),
      courses: inputCourses
        .map((course) => ({
          code: cleanText(course?.code, 24),
          name: cleanText(course?.name, 120),
          credits: numericText(course?.credits, 99, "Credits"),
          grade: cleanText(course?.grade, 12),
        }))
        .filter((course) => course.code || course.name || course.credits || course.grade),
    };
  });

  if (totalCourses > 120) throw new Error("A transcript can contain no more than 120 courses.");
  return terms.filter((term) => term.courses.length || term.tgpa || term.percentage);
}

export function validateResultPayload(input) {
  const payload = {
    documentType: cleanText(input?.documentType, 60),
    registrationNumber: normalizeIdentifier(input?.registrationNumber),
    documentNumber: normalizeIdentifier(input?.documentNumber),
    studentName: cleanText(input?.studentName, 120),
    programme: cleanText(input?.programme, 160),
    fatherName: cleanText(input?.fatherName, 120),
    motherName: cleanText(input?.motherName, 120),
    batchYear: cleanText(input?.batchYear, 20),
    studyMode: cleanText(input?.studyMode, 80),
    examSession: cleanText(input?.examSession, 80),
    resultStatus: cleanText(input?.resultStatus, 40),
    cgpa: numericText(input?.cgpa, 10, "CGPA"),
    equivalentPercentage: numericText(input?.equivalentPercentage, 100, "Equivalent percentage"),
    issueDate: cleanText(input?.issueDate, 10),
    certificateNumber: normalizeIdentifier(input?.certificateNumber || input?.documentNumber),
    printDate: cleanText(input?.printDate || input?.issueDate, 10),
    place: cleanText(input?.place, 120),
    completionStatement:
      cleanText(input?.completionStatement, 240) || "The student has successfully completed the Programme",
    terms: parseTerms(input?.terms),
  };

  const missing = [
    ["document type", payload.documentType],
    ["registration number", payload.registrationNumber],
    ["document number", payload.documentNumber],
    ["student name", payload.studentName],
    ["programme", payload.programme],
    ["batch year", payload.batchYear],
    ["study mode", payload.studyMode],
    ["examination session", payload.examSession],
    ["result status", payload.resultStatus],
    ["issue date", payload.issueDate],
    ["print date", payload.printDate],
    ["place", payload.place],
  ].find(([, value]) => !value);

  if (missing) throw new Error(`Please provide the ${missing[0]}.`);
  if (!documentTypes.has(payload.documentType)) throw new Error("Invalid document type.");
  if (!statuses.has(payload.resultStatus)) throw new Error("Invalid result status.");
  if (!/^[A-Z0-9./-]{3,80}$/.test(payload.registrationNumber)) {
    throw new Error("Registration number contains unsupported characters.");
  }
  if (!/^[A-Z0-9./-]{3,80}$/.test(payload.documentNumber)) {
    throw new Error("Document number contains unsupported characters.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.issueDate) || !/^\d{4}-\d{2}-\d{2}$/.test(payload.printDate)) {
    throw new Error("Invalid issue or print date.");
  }
  return payload;
}

export function resultFromRow(row, urls = {}) {
  let terms = [];
  try {
    terms = JSON.parse(row.terms_json || "[]");
  } catch {
    terms = [];
  }

  return {
    id: Number(row.id),
    documentType: row.document_type,
    registrationNumber: row.registration_no,
    documentNumber: row.document_no,
    studentName: row.student_name,
    programme: row.programme,
    fatherName: row.father_name,
    motherName: row.mother_name,
    batchYear: row.batch_year,
    studyMode: row.study_mode,
    examSession: row.exam_session,
    resultStatus: row.result_status,
    cgpa: row.cgpa,
    equivalentPercentage: row.equivalent_percentage,
    issueDate: row.issue_date,
    certificateNumber: row.certificate_number,
    printDate: row.print_date,
    place: row.place,
    completionStatement: row.completion_statement,
    terms,
    hasPhoto: Boolean(Number(row.has_photo)),
    photoFilename: row.photo_filename,
    photoUrl: urls.photoUrl || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function detectImageMime(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function candidatePhotoFromForm(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error("The candidate photo must be 2 MB or smaller.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectImageMime(buffer);
  if (!mime) throw new Error("The candidate photo must be a valid JPG, PNG, or WebP image.");
  return {
    buffer,
    mime,
    filename: cleanText(file.name, 180).replace(/[^A-Za-z0-9._-]/g, "_") || "candidate-photo",
  };
}
