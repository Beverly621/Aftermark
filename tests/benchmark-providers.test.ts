import assert from "node:assert/strict";
import test from "node:test";
import { createBenchmarkProviderCandidates } from "../src/lib/rendering/benchmark-providers.server";

test("uses the frozen non-preview Gemini model", () => {
  const candidates = createBenchmarkProviderCandidates({ NODE_ENV: "test" });
  const google = candidates.find(({ providerId }) => providerId === "google");

  assert.equal(google?.modelId, "gemini-3-pro-image");
  assert.equal(candidates.some(({ modelId }) => modelId.includes("preview")), false);
});

test("rejects attempts to override the frozen Gemini benchmark model", () => {
  assert.throws(
    () => createBenchmarkProviderCandidates({
      NODE_ENV: "test",
      AFTERMARK_GOOGLE_IMAGE_MODEL: "gemini-3-pro-image-preview",
    }),
    /must be gemini-3-pro-image/,
  );
});
