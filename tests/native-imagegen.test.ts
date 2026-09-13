import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  NativeSourceAnalysis,
  assertNativePromptPrivacy,
  compileNativeGenerationPlan,
  createCompositorRenderPlan,
  parseNativeSourceAnalysis,
} from "../src/lib/rendering/native-imagegen";
import {
  OUTER_ART_CENTER,
  OUTER_ART_CENTER_RADIUS,
  OUTER_ART_OUTER_RADIUS,
  normalizeAndValidateOuterArt,
} from "../src/lib/rendering/outer-art-normalization.server";
import { AftermarkStudioRequest } from "../src/lib/studio/contracts";

const request: AftermarkStudioRequest = {
  schemaVersion: "aftermark-request-v1",
  sessionId: "am_native_test_1234",
  sourceImagePath: "assets/source.png",
  stylePack: "neon_scribble",
  doodleDensity: "medium",
  compositionMode: "text_led",
  material: "classic",
  userMessage: "summer never ended",
  createdAt: "2026-09-12T12:00:00.000Z",
};

const analysis: NativeSourceAnalysis = {
  schemaVersion: "aftermark-source-analysis-v1",
  sessionId: request.sessionId,
  sourceImageSha256: "a".repeat(64),
  sourceSummary: "daylight coastal cliff and sea",
  palette: { primary: ["#4c91ae", "#d4c49b"], neutral: ["#f1eee6"], surprise: ["#ff5b9e"] },
  motifs: [
    { name: "wave", visualShorthand: "single loose curling wave line", salience: "high" },
    { name: "cliff", visualShorthand: "broken vertical contour", salience: "high" },
    { name: "bird", visualShorthand: "tiny two stroke bird", salience: "medium" },
  ],
  mood: ["open air", "late summer", "bright"],
  avoidMotifs: ["boats"],
};

test("compiles distinct text-led and motif-led outer-art plans with no literal application text", () => {
  const textLed = compileNativeGenerationPlan(request, analysis);
  const motifLed = compileNativeGenerationPlan({ ...request, compositionMode: "motif_led" }, analysis);

  assert.equal(textLed.assetRole, "outer_art_overlay");
  assert.equal(textLed.outputIntent.finalUse, "overlay_on_vinyl");
  assert.equal(textLed.outputIntent.text, "none");
  assert.equal(textLed.layout.heroLetteringReserved, true);
  assert.equal(textLed.layout.heroLetteringCorridor, "natural quiet pocket");
  assert.equal(motifLed.layout.heroLetteringReserved, false);
  assert.match(textLed.compiledPrompt, /naturally quieter pocket/i);
  assert.doesNotMatch(textLed.compiledPrompt, /lower-right|30%|96%|4–7|10–18|65%|25%|10%/i);
  assert.match(motifLed.compiledPrompt, /source-inspired doodles and gestures lead naturally/i);
  assert.match(textLed.compiledPrompt, /rather than neatly arranged/i);
  assert.match(textLed.compiledPrompt, /no readable or pseudo-readable text/i);
  assert.notEqual(textLed.compiledPrompt, motifLed.compiledPrompt);
  assert.equal(textLed.compiledPrompt.includes(request.userMessage), false);
  assert.equal(textLed.compiledPrompt.includes(request.createdAt), false);
  assert.equal(textLed.compiledPrompt.includes(request.sessionId), false);
  assert.doesNotThrow(() => assertNativePromptPrivacy(textLed, request));
  assert.ok(textLed.compiledPrompt.length < 1_500);
});

test("source analysis schema rejects unsupported or unconstrained input", () => {
  assert.deepEqual(parseNativeSourceAnalysis(analysis, request), analysis);
  assert.throws(
    () => parseNativeSourceAnalysis({ ...analysis, palette: { ...analysis.palette, surprise: [] } }, request),
    /surprise palette/,
  );
  assert.throws(
    () => parseNativeSourceAnalysis({ ...analysis, motifs: analysis.motifs.slice(0, 2) }, request),
    /3–6 motifs/,
  );
  assert.throws(
    () => compileNativeGenerationPlan({ ...request, material: "aurora" } as unknown as AftermarkStudioRequest, analysis),
    /supports only/,
  );
});

test("deterministic normalization clears the protected center and everything outside the record", async () => {
  const raw = await transparentMarksFixture();
  const result = await normalizeAndValidateOuterArt({ raw, attemptCount: 1, visualTextCheck: "pass" });
  assert.equal(result.qa.accepted, true);
  assert.equal(result.qa.attemptCount, 1);
  assert.equal(result.qa.selectedGeneratedPath, "assets/outer-art.raw.png");
  assert.ok(result.qa.centerPixelsRemoved > 0);
  assert.ok(result.qa.outsideRecordPixelsRemoved > 0);

  const center = await alphaAt(result.png, OUTER_ART_CENTER, OUTER_ART_CENTER);
  const outside = await alphaAt(result.png, 8, 8);
  const annulus = await alphaAt(result.png, OUTER_ART_CENTER + (OUTER_ART_CENTER_RADIUS + OUTER_ART_OUTER_RADIUS) / 2, OUTER_ART_CENTER);
  assert.equal(center, 0);
  assert.equal(outside, 0);
  assert.ok(annulus > 0);
});

test("rejects an opaque full-canvas background and bounds attempts to one retry", async () => {
  const opaque = await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } } }).png().toBuffer();
  const first = await normalizeAndValidateOuterArt({ raw: opaque, attemptCount: 1, visualTextCheck: "pass" });
  const second = await normalizeAndValidateOuterArt({ raw: opaque, attemptCount: 2, visualTextCheck: "pass" });
  assert.equal(first.qa.accepted, false);
  assert.equal(second.qa.accepted, false);
  assert.ok(first.qa.failures.includes("fully_opaque_full_canvas_background"));
  assert.match(first.qa.retryCorrection ?? "", /genuinely transparent/);
  assert.equal(second.qa.attemptCount, 2);
});

test("compositor plan keeps source and deterministic typography outside the native prompt", () => {
  const plan = compileNativeGenerationPlan(request, analysis);
  const renderPlan = createCompositorRenderPlan(request, analysis, plan);
  assert.equal(renderPlan.userMessage, request.userMessage);
  assert.deepEqual(renderPlan.aiPhrases, ["open air", "late summer"]);
  assert.equal(plan.compiledPrompt.includes(renderPlan.userMessage!), false);
  assert.equal(JSON.stringify(plan).includes("OPENAI_API_KEY"), false);
  assert.equal(JSON.stringify(plan).includes("GEMINI_API_KEY"), false);
  assert.equal(JSON.stringify(plan).includes("BFL_API_KEY"), false);
});

async function transparentMarksFixture(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048">
    <rect width="2048" height="2048" fill="none"/>
    <circle cx="1024" cy="1024" r="620" fill="none" stroke="#ff5b9e" stroke-width="260"/>
    <circle cx="1024" cy="1024" r="120" fill="#4c91ae"/>
    <circle cx="40" cy="40" r="30" fill="#f1eee6"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function alphaAt(buffer: Buffer, x: number, y: number): Promise<number> {
  const pixel = await sharp(buffer).extract({ left: Math.floor(x), top: Math.floor(y), width: 1, height: 1 }).ensureAlpha().raw().toBuffer();
  return pixel[3];
}
