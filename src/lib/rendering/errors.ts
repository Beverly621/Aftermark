export type RenderErrorCode =
  | "INVALID_IMAGE"
  | "INVALID_MESSAGE"
  | "INVALID_REQUEST"
  | "UNSUPPORTED_COMBINATION"
  | "MISSING_CONFIGURATION"
  | "ANALYSIS_FAILED"
  | "GENERATION_FAILED"
  | "TIMEOUT";

export class RenderPipelineError extends Error {
  constructor(
    public readonly code: RenderErrorCode,
    message: string,
    public readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RenderPipelineError";
  }
}

export function translateUnknownError(error: unknown): RenderPipelineError {
  if (error instanceof RenderPipelineError) return error;
  if (error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("timeout"))) {
    return new RenderPipelineError("TIMEOUT", "The artwork took too long to finish.", true, { cause: error });
  }
  return new RenderPipelineError("GENERATION_FAILED", "The artwork could not be completed.", true, { cause: error });
}
