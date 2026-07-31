import { validMediaToken } from "@/lib/auth";
import { getCandidatePhoto } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  const { id: rawId } = await context.params;
  const id = Number.parseInt(rawId, 10);
  const token = new URL(request.url).searchParams.get("token");
  if (!Number.isInteger(id) || !validMediaToken(token, id)) {
    return Response.json({ error: "This photo link is invalid or expired." }, { status: 404 });
  }

  const photo = await getCandidatePhoto(id);
  if (!photo) return Response.json({ error: "Candidate photo not found." }, { status: 404 });
  return new Response(photo.data, {
    headers: {
      "Content-Type": photo.mime,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
