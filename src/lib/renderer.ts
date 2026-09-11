import { mapRecordType } from "@/lib/record-types";
import { isGoldenPath } from "@/lib/rendering/neon-scribble-plan";
import { RenderErrorCode } from "@/lib/rendering/errors";
import { RecordArtDirection, RecordRenderer } from "@/types/record";

export class MockRecordRenderer implements RecordRenderer {
  async render(input: RecordArtDirection) {
    await new Promise((resolve) => window.setTimeout(resolve, 1450));
    const recordType = mapRecordType(input);
    return {
      artDirection: { ...input, recordType },
      recordType,
      catalogNumber: input.catalogNumber,
      renderedAt: new Date().toISOString(),
      renderMode: "mock" as const,
    };
  }
}

export const mockRecordRenderer = new MockRecordRenderer();

export class AIRecordRenderer implements RecordRenderer {
  constructor(private readonly endpoint = "/api/render", private readonly timeoutMs = 45_000) {}

  async render(input: RecordArtDirection) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ artDirection: input }),
        signal: controller.signal,
      });
      const payload = await response.json() as {
        result?: Awaited<ReturnType<RecordRenderer["render"]>>;
        error?: { code?: RenderErrorCode; message?: string; retryable?: boolean };
      };
      if (!response.ok || !payload.result) {
        throw new RecordRenderError(
          payload.error?.code ?? "GENERATION_FAILED",
          payload.error?.message ?? "The artwork could not be completed.",
          payload.error?.retryable ?? true,
        );
      }
      return payload.result;
    } catch (error) {
      if (error instanceof RecordRenderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new RecordRenderError("TIMEOUT", "The artwork took too long to finish.", true);
      }
      throw new RecordRenderError("GENERATION_FAILED", "The artwork could not be completed.", true);
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

export class RecordRenderError extends Error {
  constructor(public readonly code: RenderErrorCode, message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "RecordRenderError";
  }
}

const aiRecordRenderer = new AIRecordRenderer();

export function getRecordRenderer(input: RecordArtDirection): RecordRenderer {
  return isGoldenPath(input) ? aiRecordRenderer : mockRecordRenderer;
}
