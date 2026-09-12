import "server-only";

import { randomUUID } from "node:crypto";
import { access, mkdir, open, readFile, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";
import {
  AftermarkStudioRequest,
  AftermarkStudioSession,
  AftermarkStudioStatus,
  StudioBrowserSnapshot,
  StudioStatusState,
  STUDIO_STATUS_SCHEMA,
  parseStudioRequest,
  parseStudioSession,
  parseStudioStatus,
} from "@/lib/studio/contracts";

export interface StudioRuntimeContext {
  projectRoot: string;
  session: AftermarkStudioSession;
  status: AftermarkStudioStatus;
  request?: AftermarkStudioRequest;
}

export class StudioRuntimeError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "StudioRuntimeError";
  }
}

export async function loadStudioRuntimeContext(projectOverride?: string): Promise<StudioRuntimeContext> {
  const configuredProject = projectOverride ?? process.env.AFTERMARK_STUDIO_PROJECT;
  if (!configuredProject) throw new StudioRuntimeError("Aftermark Studio is not configured for a user project.", 404);
  const projectRoot = await realpath(path.resolve(configuredProject)).catch(() => {
    throw new StudioRuntimeError("The configured Aftermark project is unavailable.", 404);
  });
  const skillRoot = await realpath(process.cwd());
  if (projectRoot === skillRoot || isInside(projectRoot, skillRoot)) {
    throw new StudioRuntimeError("User projects must stay outside the reusable Aftermark Skill directory.", 403);
  }

  const session = parseStudioSession(await readJson(path.join(projectRoot, "aftermark-session.json")));
  const expectedSessionId = projectOverride ? undefined : process.env.AFTERMARK_STUDIO_SESSION_ID;
  if (expectedSessionId && expectedSessionId !== session.sessionId) {
    throw new StudioRuntimeError("Studio launcher session does not match the user project.", 409);
  }
  const status = parseStudioStatus(await readJson(path.join(projectRoot, "status.json")), session);
  const requestValue = await readOptionalJson(path.join(projectRoot, "request.json"));
  const request = requestValue ? parseStudioRequest(requestValue, session) : undefined;
  return { projectRoot, session, status, request };
}

export function assertLocalStudioRequest(request: Request): void {
  const requestUrl = new URL(request.url);
  if (!isLoopbackHostname(requestUrl.hostname)) throw new StudioRuntimeError("Studio requests are accepted only on localhost.", 403);
  const origin = request.headers.get("origin");
  if (origin) {
    const originUrl = new URL(origin);
    if (
      !isLoopbackHostname(originUrl.hostname)
      || originUrl.protocol !== requestUrl.protocol
      || normalizedPort(originUrl) !== normalizedPort(requestUrl)
    ) {
      throw new StudioRuntimeError("Cross-origin Studio requests are not allowed.", 403);
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin && fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new StudioRuntimeError("Cross-site Studio requests are not allowed.", 403);
  }
}

export async function createStudioBrowserSnapshot(context: StudioRuntimeContext): Promise<StudioBrowserSnapshot> {
  if (context.status.state === "complete") {
    if (!context.status.output) throw new StudioRuntimeError("Studio completion metadata is missing.", 409);
    await Promise.all([
      ensureFile(context.projectRoot, context.status.output.recordPath),
      ensureFile(context.projectRoot, context.status.output.shareCardPath),
      ensureFile(context.projectRoot, context.status.output.outerArtPath),
    ]);
  }
  return {
    configured: true,
    session: { sessionId: context.session.sessionId, createdAt: context.session.createdAt },
    status: context.status,
    request: context.request,
    files: {
      source: context.request ? "/api/studio/files/source" : undefined,
      record: context.status.state === "complete" ? "/api/studio/files/record" : undefined,
      shareCard: context.status.state === "complete" ? "/api/studio/files/share-card" : undefined,
    },
  };
}

export async function writeStudioRequest(
  context: StudioRuntimeContext,
  request: AftermarkStudioRequest,
  source: Buffer,
): Promise<StudioRuntimeContext> {
  if (context.request || await fileExists(path.join(context.projectRoot, "request.json"))) {
    throw new StudioRuntimeError("This Studio session already has a request. Resume it instead.", 409);
  }
  const validated = parseStudioRequest(request, context.session);
  const sourcePath = safeProjectPath(context.projectRoot, validated.sourceImagePath);
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await atomicWrite(sourcePath, source);
  await atomicWriteJson(path.join(context.projectRoot, "request.json"), validated);
  const status = await writeStudioStatus(context.projectRoot, context.session, "request_ready", "Your choices are ready for Codex.");
  return { ...context, request: validated, status };
}

export async function writeStudioStatus(
  projectRoot: string,
  session: AftermarkStudioSession,
  state: StudioStatusState,
  message?: string,
  output?: AftermarkStudioStatus["output"],
): Promise<AftermarkStudioStatus> {
  const status: AftermarkStudioStatus = {
    schemaVersion: STUDIO_STATUS_SCHEMA,
    sessionId: session.sessionId,
    state,
    updatedAt: new Date().toISOString(),
    message,
    output,
  };
  parseStudioStatus(status, session);
  await atomicWriteJson(path.join(projectRoot, "status.json"), status);
  return status;
}

export async function readStudioFile(context: StudioRuntimeContext, kind: string): Promise<{ buffer: Buffer; contentType: string }> {
  let relativePath: string | undefined;
  if (kind === "source") relativePath = context.request?.sourceImagePath;
  if (kind === "record") relativePath = context.status.output?.recordPath;
  if (kind === "share-card") relativePath = context.status.output?.shareCardPath;
  if (!relativePath) throw new StudioRuntimeError("Studio file is not available.", 404);
  if (kind !== "source" && context.status.state !== "complete") throw new StudioRuntimeError("Studio output is not complete.", 409);
  const filePath = safeProjectPath(context.projectRoot, relativePath);
  const buffer = await readFile(filePath).catch(() => {
    throw new StudioRuntimeError("Studio file is missing.", 404);
  });
  return { buffer, contentType: imageContentType(relativePath) };
}

export async function atomicWrite(filePath: string, value: Buffer | string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
  const handle = await open(temporary, "wx");
  try {
    await handle.writeFile(value);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, filePath);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
  await atomicWrite(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function safeProjectPath(projectRoot: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) throw new StudioRuntimeError("Absolute runtime paths are not allowed.", 400);
  const resolved = path.resolve(projectRoot, relativePath);
  if (!isInside(resolved, projectRoot)) throw new StudioRuntimeError("Runtime path escapes the user project.", 400);
  return resolved;
}

async function readJson(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    throw new StudioRuntimeError(`Required Studio protocol file is invalid: ${path.basename(filePath)}`, 409);
  }
}

async function readOptionalJson(filePath: string): Promise<unknown | undefined> {
  if (!await fileExists(filePath)) return undefined;
  return readJson(filePath);
}

async function ensureFile(projectRoot: string, relativePath: string): Promise<void> {
  const filePath = safeProjectPath(projectRoot, relativePath);
  if (!await fileExists(filePath)) throw new StudioRuntimeError(`Studio output is missing: ${relativePath}`, 409);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isInside(candidate: string, parent: string): boolean {
  const relative = path.relative(parent, candidate);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]";
}

function normalizedPort(url: URL): string {
  if (url.port) return url.port;
  return url.protocol === "https:" ? "443" : "80";
}

function imageContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}
