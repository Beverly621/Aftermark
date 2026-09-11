import assert from "node:assert/strict";
import test from "node:test";
import {
  ArtworkGenerationRequest,
  assertArtworkProviderBoundaryPrivacy,
  createArtworkGenerationRequest,
  createArtworkProviderPrompt,
} from "../src/lib/rendering/contracts";
import { buildNeonScribbleRenderPlan } from "../src/lib/rendering/neon-scribble-plan";
import { RenderPipelineError } from "../src/lib/rendering/errors";
import { RecordArtDirection, SourceImageAnalysis } from "../src/types/record";

const artDirection: RecordArtDirection = {
  image: "data:image/png;base64,AA==",
  stylePack: "neon_scribble",
  doodleDensity: "medium",
  compositionMode: "motif_led",
  material: "classic",
  userMessage: "private words stay deterministic",
  date: "2026-09-10",
  catalogNumber: "NS-260910-037",
};

const analysis: SourceImageAnalysis = {
  palette: { primary: "#2bc4d9", secondary: "#ffd34e", neutral: "#f4f0e6", surprise: "#ff4f9a" },
  motifs: ["Wave", "sun", "bird", "wave", "cliff!!!", "extra motif"],
  sourceImageSha256: "hash",
  analysisMode: "development",
};

test("builds an inspectable Golden Path plan with a protected center", () => {
  const plan = buildNeonScribbleRenderPlan({ artDirection, analysis, aiPhrases: ["salt air", "late light", "this phrase has far too many words to pass"] });
  assert.equal(plan.version, "neon-scribble-v2");
  assert.equal(plan.density, "medium");
  assert.equal(plan.material, "classic");
  assert.equal(plan.composition.centerLabelRatio, 0.3);
  assert.equal(plan.composition.centerProtection, "composite-source-last");
  assert.equal(plan.compositionMode, "motif_led");
  assert.equal(plan.composition.heroLetteringZone.reserved, false);
  assert.deepEqual(plan.motifs, ["wave", "sun", "bird", "cliff"]);
  assert.deepEqual(plan.aiPhrases, ["salt air", "late light"]);
  assert.deepEqual(plan.palette, analysis.palette);
});

test("builds distinct structured TEXT-LED and MOTIF-LED plans without provider-rendered user text", () => {
  const textLed = buildNeonScribbleRenderPlan({ artDirection: { ...artDirection, compositionMode: "text_led" }, analysis, aiPhrases: ["salt air"] });
  const motifLed = buildNeonScribbleRenderPlan({ artDirection: { ...artDirection, compositionMode: "motif_led" }, analysis, aiPhrases: ["salt air"] });

  assert.equal(textLed.composition.heroLetteringZone.reserved, true);
  assert.match(textLed.prompt, /reserve an open lower-right outer-vinyl arc/i);
  assert.equal(motifLed.composition.heroLetteringZone.reserved, false);
  assert.match(motifLed.prompt, /65% of marks as loose micro symbols/i);
  assert.notEqual(textLed.prompt, motifLed.prompt);
  assert.equal(textLed.prompt.includes(artDirection.userMessage!), false);
  assert.equal(motifLed.prompt.includes(artDirection.userMessage!), false);
});

test("never sends user text or deterministic metadata to the artwork prompt", () => {
  const plan = buildNeonScribbleRenderPlan({ artDirection, analysis, aiPhrases: ["salt air"] });
  assert.equal(plan.prompt.includes(artDirection.userMessage!), false);
  assert.equal(plan.prompt.includes(artDirection.catalogNumber), false);
  assert.match(plan.prompt, /No typography, letters, numbers/);
});

test("minimizes the provider request and excludes all deterministic text", () => {
  const plan = buildNeonScribbleRenderPlan({ artDirection, analysis, aiPhrases: ["salt air"] });
  const providerRequest = createArtworkGenerationRequest("request-id", plan);
  const serialized = JSON.stringify({ providerRequest, outboundPrompt: createArtworkProviderPrompt(providerRequest) });

  assert.equal(serialized.includes(artDirection.userMessage!), false);
  assert.equal(serialized.includes(artDirection.catalogNumber), false);
  assert.equal(serialized.includes(artDirection.date), false);
  assert.equal(serialized.includes("salt air"), false);
  assert.equal("userMessage" in providerRequest.plan, false);
  assert.equal("aiPhrases" in providerRequest.plan, false);
  assert.doesNotThrow(() => assertArtworkProviderBoundaryPrivacy(providerRequest, {
    userMessage: artDirection.userMessage,
    catalogNumber: artDirection.catalogNumber,
    date: artDirection.date,
    applicationRenderedPhrases: ["salt air"],
  }));
});

test("rejects any deterministic text crossing the artwork-provider boundary", () => {
  const plan = buildNeonScribbleRenderPlan({
    artDirection: { ...artDirection, compositionMode: "text_led" },
    analysis,
    aiPhrases: ["salt air"],
  });
  const safeRequest = createArtworkGenerationRequest("request-id", plan);
  assert.doesNotThrow(() => assertArtworkProviderBoundaryPrivacy(safeRequest, {
    userMessage: artDirection.userMessage,
    catalogNumber: artDirection.catalogNumber,
    date: artDirection.date,
    applicationRenderedPhrases: ["salt air"],
  }));

  const unsafeRequest = {
    ...safeRequest,
    plan: { ...safeRequest.plan, userMessage: artDirection.userMessage },
  } as ArtworkGenerationRequest;
  assert.throws(
    () => assertArtworkProviderBoundaryPrivacy(unsafeRequest, {
      userMessage: artDirection.userMessage,
      catalogNumber: artDirection.catalogNumber,
      date: artDirection.date,
      applicationRenderedPhrases: ["salt air"],
    }),
    /forbidden deterministic field/,
  );
});

test("rejects combinations outside Task 01", () => {
  assert.throws(
    () => buildNeonScribbleRenderPlan({ artDirection: { ...artDirection, material: "aurora" }, analysis, aiPhrases: ["salt air"] }),
    (error) => error instanceof RenderPipelineError && error.code === "UNSUPPORTED_COMBINATION",
  );
});
