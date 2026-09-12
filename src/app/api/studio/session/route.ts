import {
  StudioRuntimeError,
  assertLocalStudioRequest,
  createStudioBrowserSnapshot,
  loadStudioRuntimeContext,
} from "@/lib/studio/runtime.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    assertLocalStudioRequest(request);
    const snapshot = await createStudioBrowserSnapshot(await loadStudioRuntimeContext());
    return Response.json(snapshot, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

function studioErrorResponse(error: unknown) {
  const runtimeError = error instanceof StudioRuntimeError ? error : new StudioRuntimeError("Aftermark Studio could not read this session.", 500);
  return Response.json(
    { configured: false, error: runtimeError.message },
    { status: runtimeError.status, headers: { "cache-control": "no-store" } },
  );
}
