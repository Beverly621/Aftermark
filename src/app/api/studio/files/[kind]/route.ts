import {
  StudioRuntimeError,
  assertLocalStudioRequest,
  loadStudioRuntimeContext,
  readStudioFile,
} from "@/lib/studio/runtime.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    assertLocalStudioRequest(request);
    const { kind } = await params;
    if (!new Set(["source", "record", "share-card"]).has(kind)) throw new StudioRuntimeError("Unknown Studio file.", 404);
    const file = await readStudioFile(await loadStudioRuntimeContext(), kind);
    return new Response(Uint8Array.from(file.buffer).buffer, {
      headers: {
        "content-type": file.contentType,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const runtimeError = error instanceof StudioRuntimeError ? error : new StudioRuntimeError("Studio file is unavailable.", 500);
    return Response.json({ error: runtimeError.message }, { status: runtimeError.status, headers: { "cache-control": "no-store" } });
  }
}
