import { validateUserMessage } from "@/lib/message-validation";
import { CompositionMode, RecordArtDirection } from "@/types/record";

export const STUDIO_SESSION_SCHEMA = "aftermark-session-v1" as const;
export const STUDIO_REQUEST_SCHEMA = "aftermark-request-v1" as const;
export const STUDIO_STATUS_SCHEMA = "aftermark-status-v1" as const;
export const STUDIO_STATUS_STATES = [
  "waiting_for_user",
  "request_ready",
  "generating_outer_art",
  "compositing",
  "complete",
  "error",
] as const;

export type StudioStatusState = typeof STUDIO_STATUS_STATES[number];

export const TASK_2C01_STUDIO_SELECTION = {
  stylePack: "neon_scribble",
  doodleDensity: "medium",
  material: "classic",
} as const;

export type Task2C01SelectionField = keyof typeof TASK_2C01_STUDIO_SELECTION;
export type Task2C01StudioSelection = typeof TASK_2C01_STUDIO_SELECTION;

export function isTask2C01StudioOptionSupported(field: Task2C01SelectionField, value: string): boolean {
  return TASK_2C01_STUDIO_SELECTION[field] === value;
}

export function assertTask2C01StudioSelection(
  artDirection: Pick<RecordArtDirection, Task2C01SelectionField>,
): asserts artDirection is Pick<RecordArtDirection, Task2C01SelectionField> & Task2C01StudioSelection {
  for (const field of Object.keys(TASK_2C01_STUDIO_SELECTION) as Task2C01SelectionField[]) {
    if (!isTask2C01StudioOptionSupported(field, artDirection[field])) {
      throw new StudioProtocolError(`The selected ${field} option is not available in Local Studio yet.`);
    }
  }
}

export interface AftermarkStudioSession {
  schemaVersion: typeof STUDIO_SESSION_SCHEMA;
  sessionId: string;
  createdAt: string;
}

export interface AftermarkStudioRequest {
  schemaVersion: typeof STUDIO_REQUEST_SCHEMA;
  sessionId: string;
  sourceImagePath: string;
  stylePack: "neon_scribble";
  doodleDensity: "medium";
  compositionMode: CompositionMode;
  material: "classic";
  userMessage: string;
  createdAt: string;
}

export interface AftermarkStudioOutput {
  recordPath: "output/record.png";
  shareCardPath: "output/share-card.png";
  outerArtPath: "assets/outer-art.png";
  recordType: string;
  catalogNumber: string;
  renderedAt: string;
}

export interface AftermarkStudioStatus {
  schemaVersion: typeof STUDIO_STATUS_SCHEMA;
  sessionId: string;
  state: StudioStatusState;
  updatedAt: string;
  message?: string;
  output?: AftermarkStudioOutput;
}

export interface StudioBrowserSnapshot {
  configured: true;
  session: Pick<AftermarkStudioSession, "sessionId" | "createdAt">;
  status: AftermarkStudioStatus;
  request?: AftermarkStudioRequest;
  files: {
    source?: "/api/studio/files/source";
    record?: "/api/studio/files/record";
    shareCard?: "/api/studio/files/share-card";
  };
}

export class StudioProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudioProtocolError";
  }
}

export function parseStudioSession(value: unknown): AftermarkStudioSession {
  const input = objectValue(value, "aftermark-session.json");
  assertExactKeys(input, ["schemaVersion", "sessionId", "createdAt"], "aftermark-session.json");
  if (input.schemaVersion !== STUDIO_SESSION_SCHEMA) throw new StudioProtocolError("Unsupported Studio session schema.");
  if (typeof input.sessionId !== "string" || !/^am_[a-z0-9_-]{12,80}$/i.test(input.sessionId)) {
    throw new StudioProtocolError("Invalid Studio session ID.");
  }
  assertIsoTimestamp(input.createdAt, "Session createdAt");
  return input as unknown as AftermarkStudioSession;
}

export function parseStudioRequest(
  value: unknown,
  session: AftermarkStudioSession,
): AftermarkStudioRequest {
  const input = objectValue(value, "request.json");
  assertExactKeys(input, [
    "schemaVersion",
    "sessionId",
    "sourceImagePath",
    "stylePack",
    "doodleDensity",
    "compositionMode",
    "material",
    "userMessage",
    "createdAt",
  ], "request.json");
  if (input.schemaVersion !== STUDIO_REQUEST_SCHEMA) throw new StudioProtocolError("Unsupported Studio request schema.");
  if (input.sessionId !== session.sessionId) throw new StudioProtocolError("Studio request belongs to a different session.");
  if (typeof input.sourceImagePath !== "string" || !/^assets\/source\.(png|jpe?g|webp)$/i.test(input.sourceImagePath)) {
    throw new StudioProtocolError("Studio request contains an unsafe source image path.");
  }
  if (input.stylePack !== "neon_scribble" || input.doodleDensity !== "medium" || input.material !== "classic") {
    throw new StudioProtocolError("Task 2C01 supports only the frozen Neon Scribble golden path.");
  }
  if (input.compositionMode !== "text_led" && input.compositionMode !== "motif_led") {
    throw new StudioProtocolError("Studio request contains an invalid composition mode.");
  }
  if (typeof input.userMessage !== "string" || !validateUserMessage(input.userMessage).valid) {
    throw new StudioProtocolError("Studio request contains an invalid user message.");
  }
  const requestTime = assertIsoTimestamp(input.createdAt, "Request createdAt");
  const sessionTime = new Date(session.createdAt);
  if (requestTime < sessionTime) throw new StudioProtocolError("Studio request is stale for this session.");
  return input as unknown as AftermarkStudioRequest;
}

export function parseStudioStatus(value: unknown, session: AftermarkStudioSession): AftermarkStudioStatus {
  const input = objectValue(value, "status.json");
  const allowed = ["schemaVersion", "sessionId", "state", "updatedAt", "message", "output"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new StudioProtocolError("status.json has unexpected fields.");
  if (input.schemaVersion !== STUDIO_STATUS_SCHEMA || input.sessionId !== session.sessionId) {
    throw new StudioProtocolError("Studio status does not match this session.");
  }
  if (!STUDIO_STATUS_STATES.includes(input.state as StudioStatusState)) throw new StudioProtocolError("Studio status state is invalid.");
  assertIsoTimestamp(input.updatedAt, "Status updatedAt");
  if (input.message !== undefined && typeof input.message !== "string") throw new StudioProtocolError("Studio status message is invalid.");
  if (input.output !== undefined) parseStudioOutput(input.output);
  return input as unknown as AftermarkStudioStatus;
}

function parseStudioOutput(value: unknown): AftermarkStudioOutput {
  const input = objectValue(value, "status output");
  assertExactKeys(input, ["recordPath", "shareCardPath", "outerArtPath", "recordType", "catalogNumber", "renderedAt"], "status output");
  if (input.recordPath !== "output/record.png" || input.shareCardPath !== "output/share-card.png" || input.outerArtPath !== "assets/outer-art.png") {
    throw new StudioProtocolError("Studio output contains an unsafe path.");
  }
  if (typeof input.recordType !== "string" || !input.recordType || typeof input.catalogNumber !== "string" || !/^NS-\d{6}-\d{3}$/.test(input.catalogNumber)) {
    throw new StudioProtocolError("Studio output metadata is invalid.");
  }
  assertIsoTimestamp(input.renderedAt, "Output renderedAt");
  return input as unknown as AftermarkStudioOutput;
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new StudioProtocolError(`${label} must be a JSON object.`);
  return value as Record<string, unknown>;
}

function assertExactKeys(input: Record<string, unknown>, expected: string[], label: string): void {
  const actual = Object.keys(input).sort();
  const wanted = [...expected].sort();
  if (actual.join("\0") !== wanted.join("\0")) throw new StudioProtocolError(`${label} has missing or unexpected fields.`);
}

function assertIsoTimestamp(value: unknown, label: string): Date {
  if (typeof value !== "string") throw new StudioProtocolError(`${label} must be an ISO-8601 timestamp.`);
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()) || !/[zZ]|[+-]\d\d:\d\d$/.test(value)) {
    throw new StudioProtocolError(`${label} must be an ISO-8601 timestamp with timezone.`);
  }
  return date;
}
