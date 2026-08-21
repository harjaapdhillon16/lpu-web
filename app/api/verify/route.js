import { resultDocumentUrl } from "@/lib/auth";
import { findPublicResult } from "@/lib/db";
import { publicLookupPayload, resultFromRow } from "@/lib/results";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const lookup = publicLookupPayload(await request.json());
    if (Object.values(lookup).some((value) => !value)) {
      return Response.json(
        { error: "Select a document type and enter both reference numbers." },
        { status: 400 },
      );
    }

    const row = await findPublicResult(lookup);
    if (!row) {
      return Response.json(
        { error: "No matching academic record was found. Check all three values and try again." },
        { status: 404 },
      );
    }

    const pdfUrl = resultDocumentUrl(row.id);
    return Response.json({ result: resultFromRow(row, { pdfUrl }) });
  } catch (error) {
    console.error("Verification failed:", error);
    return Response.json({ error: "The verification request could not be completed." }, { status: 500 });
  }
}
