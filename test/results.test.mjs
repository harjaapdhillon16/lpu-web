import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeIdentifier,
  publicLookupPayload,
  resultPdfFromForm,
  validateResultPayload,
} from "../lib/results.js";

const validPayload = {
  documentType: "Academic Transcript",
  registrationNumber: " 1180 1234 ",
  documentNumber: "lpu/tr/2026/8891",
  studentName: "Aarav Sharma",
  programme: "Bachelor of Technology (Computer Science)",
  examSession: "May 2026",
  issueDate: "2026-07-20",
};

function pdfFile(bytes, { name = "transcript.pdf" } = {}) {
  const buffer = Buffer.from(bytes);
  return {
    name,
    size: buffer.length,
    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length),
  };
}

test("the lookup identifiers are normalized the same way for admin and public input", () => {
  const payload = validateResultPayload(validPayload);
  assert.equal(payload.registrationNumber, "11801234");
  assert.equal(payload.documentNumber, "LPU/TR/2026/8891");

  const lookup = publicLookupPayload({ ...validPayload, registrationNumber: "1180 1234" });
  assert.equal(lookup.registrationNumber, payload.registrationNumber);
  assert.equal(lookup.documentNumber, payload.documentNumber);
  assert.equal(normalizeIdentifier(" lpu 26 / 1 "), "LPU26/1");
});

test("missing identifiers and unsupported characters are rejected", () => {
  assert.throws(() => validateResultPayload({ ...validPayload, studentName: "" }), /student name/);
  assert.throws(() => validateResultPayload({ ...validPayload, documentType: "Marksheet" }), /Invalid document type/);
  assert.throws(
    () => validateResultPayload({ ...validPayload, registrationNumber: "ABC @ 12" }),
    /unsupported characters/,
  );
});

test("only real PDF uploads are accepted", async () => {
  const accepted = await resultPdfFromForm(pdfFile("%PDF-1.7\nresult body"));
  assert.equal(accepted.filename, "transcript.pdf");
  assert.equal(accepted.size, Buffer.from("%PDF-1.7\nresult body").length);

  await assert.rejects(() => resultPdfFromForm(pdfFile("<html>not a pdf</html>")), /valid PDF/);
  assert.equal(await resultPdfFromForm(null), null);
});

test("an uploaded name without an extension still gets one", async () => {
  const uploaded = await resultPdfFromForm(pdfFile("%PDF-1.4 body", { name: "result copy" }));
  assert.equal(uploaded.filename, "result_copy.pdf");
});
