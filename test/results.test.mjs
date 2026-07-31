import assert from "node:assert/strict";
import test from "node:test";
import { candidatePhotoFromForm, normalizeIdentifier, validateResultPayload } from "../lib/results.js";

const validPayload = {
  documentType: "Academic Transcript",
  registrationNumber: " 1220 0001 ",
  documentNumber: "tr-2026-001",
  studentName: "Aarav Sharma",
  programme: "Bachelor of Arts",
  fatherName: "Rakesh Sharma",
  motherName: "Meena Sharma",
  batchYear: "2022",
  studyMode: "Regular",
  examSession: "May 2026",
  resultStatus: "Completed",
  cgpa: "8.64",
  equivalentPercentage: "78.20",
  issueDate: "2026-06-20",
  certificateNumber: "CERT-2026-001",
  printDate: "2026-07-31",
  place: "Phagwara (Punjab)",
  completionStatement: "The student has successfully completed the Programme",
  terms: [
    {
      label: "Term : 1",
      tgpa: "8.45",
      percentage: "76.10",
      courses: [
        { code: "ENG101", name: "English I", credits: "4", grade: "A" },
        { code: "HIS101", name: "Indian History", credits: "4", grade: "A-" },
      ],
    },
  ],
};

test("structured transcript payload is normalized and retains term rows", () => {
  const result = validateResultPayload(validPayload);
  assert.equal(result.registrationNumber, "12200001");
  assert.equal(result.documentNumber, "TR-2026-001");
  assert.equal(result.terms.length, 1);
  assert.equal(result.terms[0].courses[1].name, "Indian History");
});

test("invalid percentage and unsupported identifiers are rejected", () => {
  assert.throws(
    () => validateResultPayload({ ...validPayload, equivalentPercentage: "120" }),
    /Equivalent percentage/,
  );
  assert.throws(
    () => validateResultPayload({ ...validPayload, registrationNumber: "ABC @ 12" }),
    /unsupported characters/,
  );
});

test("candidate image validation checks magic bytes and size", async () => {
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const validImage = new File([pngHeader], "candidate.png", { type: "image/png" });
  const image = await candidatePhotoFromForm(validImage);
  assert.equal(image.mime, "image/png");
  assert.equal(image.filename, "candidate.png");

  const invalidImage = new File([new TextEncoder().encode("not an image")], "candidate.png", {
    type: "image/png",
  });
  await assert.rejects(() => candidatePhotoFromForm(invalidImage), /valid JPG, PNG, or WebP/);
});

test("identifier normalization removes whitespace and uses uppercase", () => {
  assert.equal(normalizeIdentifier(" tr 2026 / ab-1 "), "TR2026/AB-1");
});
