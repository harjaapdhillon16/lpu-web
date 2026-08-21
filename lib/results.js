const documentTypes = new Set(["Degree", "Academic Transcript", "Skill Development Certificate"]);

export const maximumPdfBytes = 20 * 1024 * 1024;

export function cleanText(value, maximum = 160) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maximum);
}

export function normalizeIdentifier(value) {
  return cleanText(value, 80).replace(/\s+/g, "").toUpperCase();
}

/** The three values the public landing page asks for, normalized the same way on both sides. */
export function publicLookupPayload(input) {
  return {
    documentType: cleanText(input?.documentType, 60),
    registrationNumber: normalizeIdentifier(input?.registrationNumber),
    documentNumber: normalizeIdentifier(input?.documentNumber),
  };
}

export function validateResultPayload(input) {
  const payload = {
    ...publicLookupPayload(input),
    studentName: cleanText(input?.studentName, 120),
    programme: cleanText(input?.programme, 160),
    examSession: cleanText(input?.examSession, 80),
    issueDate: cleanText(input?.issueDate, 10),
  };

  const missing = [
    ["document type", payload.documentType],
    ["registration number", payload.registrationNumber],
    ["document number", payload.documentNumber],
    ["student name", payload.studentName],
  ].find(([, value]) => !value);

  if (missing) throw new Error(`Please provide the ${missing[0]}.`);
  if (!documentTypes.has(payload.documentType)) throw new Error("Invalid document type.");
  if (!/^[A-Z0-9./-]{3,80}$/.test(payload.registrationNumber)) {
    throw new Error("Registration number contains unsupported characters.");
  }
  if (!/^[A-Z0-9./-]{3,80}$/.test(payload.documentNumber)) {
    throw new Error("Document number contains unsupported characters.");
  }
  if (payload.issueDate && !/^\d{4}-\d{2}-\d{2}$/.test(payload.issueDate)) {
    throw new Error("Invalid issue date.");
  }
  return payload;
}

export function resultFromRow(row, urls = {}) {
  return {
    id: Number(row.id),
    documentType: row.document_type,
    registrationNumber: row.registration_no,
    documentNumber: row.document_no,
    studentName: row.student_name,
    programme: row.programme,
    examSession: row.exam_session,
    issueDate: row.issue_date,
    pdfFilename: row.pdf_filename,
    pdfSizeBytes: Number(row.pdf_size_bytes || 0),
    pdfUrl: urls.pdfUrl || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Reads the uploaded result PDF, verifying it really is a PDF before it reaches storage. */
export async function resultPdfFromForm(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  if (file.size > maximumPdfBytes) throw new Error("The result PDF must be 20 MB or smaller.");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("The uploaded result file must be a valid PDF.");
  }
  const filename = cleanText(file.name, 180).replace(/[^A-Za-z0-9._-]/g, "_") || "result.pdf";
  return {
    buffer,
    size: buffer.length,
    filename: filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`,
  };
}
