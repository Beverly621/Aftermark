import {
  AftermarkStudioRequest,
  StudioBrowserSnapshot,
  assertTask2C01StudioSelection,
} from "@/lib/studio/contracts";
import { RecordArtDirection, RecordRenderResult } from "@/types/record";

export async function fetchStudioSnapshot(): Promise<StudioBrowserSnapshot | undefined> {
  const response = await fetch("/api/studio/session", { cache: "no-store" });
  if (response.status === 404) return undefined;
  const payload = await response.json() as StudioBrowserSnapshot & { error?: string };
  if (!response.ok || !payload.configured) throw new Error(payload.error ?? "Aftermark Studio could not restore this session.");
  return payload;
}

export async function submitStudioRequest(input: {
  sessionId: string;
  image: string;
  artDirection: RecordArtDirection;
}): Promise<StudioBrowserSnapshot> {
  const sourceResponse = await fetch(input.image);
  const source = await sourceResponse.blob();
  const extension = sourceExtension(source.type);
  const request = createStudioRequest({
    sessionId: input.sessionId,
    sourceImagePath: `assets/source.${extension}`,
    artDirection: input.artDirection,
    createdAt: new Date().toISOString(),
  });
  const form = new FormData();
  form.set("source", source, `source.${extension}`);
  form.set("request", JSON.stringify(request));
  const response = await fetch("/api/studio/request", { method: "POST", body: form });
  const payload = await response.json() as StudioBrowserSnapshot & { error?: string };
  if (!response.ok || !payload.configured) throw new Error(payload.error ?? "Aftermark Studio could not save this request.");
  return payload;
}

export function createStudioRequest(input: {
  sessionId: string;
  sourceImagePath: string;
  artDirection: RecordArtDirection;
  createdAt: string;
}): AftermarkStudioRequest {
  assertTask2C01StudioSelection(input.artDirection);
  return {
    schemaVersion: "aftermark-request-v1",
    sessionId: input.sessionId,
    sourceImagePath: input.sourceImagePath,
    stylePack: input.artDirection.stylePack,
    doodleDensity: input.artDirection.doodleDensity,
    compositionMode: input.artDirection.compositionMode,
    material: input.artDirection.material,
    userMessage: input.artDirection.userMessage ?? "",
    createdAt: input.createdAt,
  };
}

export function studioResult(snapshot: StudioBrowserSnapshot): RecordRenderResult | undefined {
  const request = snapshot.request;
  const output = snapshot.status.output;
  if (snapshot.status.state !== "complete" || !request || !output || !snapshot.files.record || !snapshot.files.source) return undefined;
  const version = encodeURIComponent(snapshot.status.updatedAt);
  const artDirection: RecordArtDirection = {
    image: `${snapshot.files.source}?v=${version}`,
    stylePack: request.stylePack,
    doodleDensity: request.doodleDensity,
    compositionMode: request.compositionMode,
    material: request.material,
    userMessage: request.userMessage,
    date: request.createdAt.slice(0, 10),
    catalogNumber: output.catalogNumber,
    recordType: output.recordType,
  };
  return {
    artDirection,
    recordType: output.recordType,
    catalogNumber: output.catalogNumber,
    renderedAt: output.renderedAt,
    mainArtwork: {
      dataUrl: `${snapshot.files.record}?v=${version}`,
      mimeType: "image/png",
      width: 2048,
      height: 2048,
    },
    renderMode: output.generator === "codex_native" ? "production" : "development",
    ...(output.generator === "codex_native" ? {} : {
      providerDiagnostics: {
        providerId: "development-svg-outer-art-v1",
        modelId: "deterministic-svg-v1",
        latencyMs: 0,
        costUsd: 0,
        costKind: "actual" as const,
      },
    }),
  };
}

function sourceExtension(mimeType: string): "png" | "jpg" | "webp" {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  throw new Error("Use a PNG, JPEG, or WebP source image.");
}
