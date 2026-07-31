import { createMediaToken } from "@/lib/auth";
import { findPublicResult } from "@/lib/db";
import { cleanText, normalizeIdentifier, resultFromRow } from "@/lib/results";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const input = await request.json();
    const documentType = cleanText(input.documentType, 60);
    const registrationNumber = normalizeIdentifier(input.registrationNumber);
    const documentNumber = normalizeIdentifier(input.documentNumber);
    if (!documentType || !registrationNumber || !documentNumber) {
      return Response.json(
        { error: "Select a document type and enter both reference numbers." },
        { status: 400 },
      );
    }

    const row = await findPublicResult(documentType, registrationNumber, documentNumber);
    if (!row) {
      return Response.json(
        { error: "No matching academic record was found. Check all three values and try again." },
        { status: 404 },
      );
    }

    const photoUrl = Number(row.has_photo)
      ? `/api/results/${row.id}/photo?token=${encodeURIComponent(createMediaToken(row.id))}`
      : null;
    return Response.json({ result: resultFromRow(row, { photoUrl }) });
  } catch (error) {
    console.error("Verification failed:", error);
    return Response.json({ error: "The verification request could not be completed." }, { status: 500 });
  }
}
