import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import sharp from "sharp";
import { CENTER_LABEL_DIAMETER, createDeterministicTextSvg, RECORD_CENTER, SharpFinalRecordCompositor } from "../src/lib/rendering/compositor.server";
import { ArtworkGenerationResult } from "../src/lib/rendering/contracts";
import { NeonScribbleRenderPlan, RecordArtDirection } from "../src/types/record";

test("composites the source label after an outer layer that invades the center", async () => {
  const source = await sharp({ create: { width: 640, height: 420, channels: 3, background: { r: 226, g: 52, b: 65 } } }).png().toBuffer();
  const artDirection = fixtureArtDirection(source);
  const outerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048"><rect width="2048" height="2048" fill="#00ff00"/></svg>`;
  const result = await new SharpFinalRecordCompositor().compose({
    artDirection,
    plan: fixturePlan,
    outerArtwork: fixtureOuterArtwork(outerSvg),
  });

  const output = Buffer.from(result.artwork.dataUrl.split(",")[1], "base64");
  const pixel = await sharp(output).extract({ left: RECORD_CENTER.x, top: RECORD_CENTER.y, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  const backgroundPixel = await sharp(output).extract({ left: 20, top: 20, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  assert.deepEqual([...pixel], [226, 52, 65]);
  assert.notDeepEqual([...backgroundPixel], [0, 255, 0]);
  assert.equal(result.sourceImageSha256, createHash("sha256").update(source).digest("hex"));
  assert.equal(result.artwork.width, 2048);
  assert.equal(CENTER_LABEL_DIAMETER, 444);
});

test("critical composition is byte-deterministic for identical input", async () => {
  const source = await sharp({ create: { width: 500, height: 500, channels: 3, background: { r: 42, g: 120, b: 176 } } }).png().toBuffer();
  const input = {
    artDirection: fixtureArtDirection(source),
    plan: fixturePlan,
    outerArtwork: fixtureOuterArtwork(`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048"><path d="M100 100L500 500" stroke="#ff4f9a" stroke-width="30"/></svg>`),
  };
  const compositor = new SharpFinalRecordCompositor();
  const first = await compositor.compose(input);
  const second = await compositor.compose(input);
  assert.equal(first.artwork.dataUrl, second.artwork.dataUrl);
});

test("user text remains deterministic and application-rendered in both composition modes", () => {
  const source = Buffer.from("source");
  for (const compositionMode of ["text_led", "motif_led"] as const) {
    const artDirection = { ...fixtureArtDirection(source), compositionMode, userMessage: "夏天没有结束 & always" };
    const plan = {
      ...fixturePlan,
      compositionMode,
      composition: { ...fixturePlan.composition, heroLetteringZone: { ...fixturePlan.composition.heroLetteringZone, reserved: compositionMode === "text_led" } },
    };
    const input = { artDirection, plan, outerArtwork: fixtureOuterArtwork("") };
    const first = createDeterministicTextSvg(input);
    const second = createDeterministicTextSvg(input);
    assert.equal(first, second);
    assert.match(first, /夏天没有结束 &amp; always/);
    assert.equal(plan.prompt.includes(artDirection.userMessage), false);
  }
});

function fixtureArtDirection(source: Buffer): RecordArtDirection {
  return {
    image: `data:image/png;base64,${source.toString("base64")}`,
    stylePack: "neon_scribble",
    doodleDensity: "medium",
    compositionMode: "motif_led",
    material: "classic",
    userMessage: "we were here",
    date: "2026-09-10",
    catalogNumber: "NS-260910-037",
    imagePalette: fixturePlan.palette,
  };
}

const fixturePlan: NeonScribbleRenderPlan = {
  version: "neon-scribble-v2",
  palette: { primary: "#2bc4d9", secondary: "#ffd34e", neutral: "#f4f0e6", surprise: "#ff4f9a" },
  density: "medium",
  material: "classic",
  compositionMode: "motif_led",
  motifs: ["wave", "sun"],
  userMessage: "we were here",
  aiPhrases: ["salt air", "late light"],
  composition: {
    centerLabelRatio: 0.3,
    preserveGrooves: true,
    maxLargeMotifs: 1,
    centerProtection: "composite-source-last",
    heroLetteringZone: { reserved: false, placement: "lower-right-arc", applicationOwnedText: true },
  },
  prompt: "fixture",
  negativePrompt: "fixture",
};

function fixtureOuterArtwork(svg: string): ArtworkGenerationResult {
  return {
    layerDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    mimeType: "image/svg+xml",
    providerId: "test",
    modelId: "fixture",
    providerMode: "development",
    requestId: "request-id",
    latencyMs: 0,
    cost: { kind: "actual", amountUsd: 0 },
  };
}
