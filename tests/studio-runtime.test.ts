import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createStudioRequest } from "../src/lib/studio/client";
import {
  AftermarkStudioSession,
  AftermarkStudioStatus,
  StudioBrowserSnapshot,
  parseStudioRequest,
} from "../src/lib/studio/contracts";
import {
  assertLocalStudioRequest,
  createStudioBrowserSnapshot,
} from "../src/lib/studio/runtime.server";

const session: AftermarkStudioSession = {
  schemaVersion: "aftermark-session-v1",
  sessionId: "am_1234567890abcdef",
  createdAt: "2026-09-12T12:00:00.000Z",
};

function requestValue(sessionId = session.sessionId) {
  return {
    schemaVersion: "aftermark-request-v1",
    sessionId,
    sourceImagePath: "assets/source.png",
    stylePack: "neon_scribble",
    doodleDensity: "medium",
    compositionMode: "text_led",
    material: "classic",
    userMessage: "summer never ended",
    createdAt: "2026-09-12T12:01:00.000Z",
  };
}

test("validates the frozen Studio request schema and rejects session mismatch", () => {
  const parsed = parseStudioRequest(requestValue(), session);
  assert.equal(parsed.compositionMode, "text_led");
  assert.throws(() => parseStudioRequest(requestValue("am_different_session"), session), /different session/);
  assert.throws(() => parseStudioRequest({ ...requestValue(), sourceImagePath: "../../private.jpg" }, session), /unsafe source image path/);
});

test("Studio request creation rejects unsupported visible selections instead of replacing them", () => {
  const artDirection = {
    image: "data:image/png;base64,AA==",
    stylePack: "neon_scribble" as const,
    doodleDensity: "medium" as const,
    compositionMode: "motif_led" as const,
    material: "classic" as const,
    userMessage: "summer never ended",
    date: "2026-09-12",
    catalogNumber: "NS-260912-001",
  };
  const request = createStudioRequest({
    sessionId: session.sessionId,
    sourceImagePath: "assets/source.png",
    artDirection,
    createdAt: "2026-09-12T12:01:00.000Z",
  });
  assert.equal(request.stylePack, artDirection.stylePack);
  assert.equal(request.doodleDensity, artDirection.doodleDensity);
  assert.equal(request.material, artDirection.material);
  assert.throws(() => createStudioRequest({
    sessionId: session.sessionId,
    sourceImagePath: "assets/source.png",
    artDirection: { ...artDirection, stylePack: "dream_archive" },
    createdAt: "2026-09-12T12:01:00.000Z",
  }), /not available/);
  assert.throws(() => createStudioRequest({
    sessionId: session.sessionId,
    sourceImagePath: "assets/source.png",
    artDirection: { ...artDirection, doodleDensity: "high" },
    createdAt: "2026-09-12T12:01:00.000Z",
  }), /not available/);
  assert.throws(() => createStudioRequest({
    sessionId: session.sessionId,
    sourceImagePath: "assets/source.png",
    artDirection: { ...artDirection, material: "aurora" },
    createdAt: "2026-09-12T12:01:00.000Z",
  }), /not available/);
});

test("browser snapshot exposes session protocol data but no project path or secret", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "aftermark-browser-snapshot-"));
  try {
    const status: AftermarkStudioStatus = {
      schemaVersion: "aftermark-status-v1",
      sessionId: session.sessionId,
      state: "waiting_for_user",
      updatedAt: "2026-09-12T12:00:00.000Z",
    };
    const snapshot = await createStudioBrowserSnapshot({ projectRoot, session, status });
    const serialized = JSON.stringify(snapshot);
    assert.equal(serialized.includes(projectRoot), false);
    assert.equal(/api[_-]?key|providerId|modelId/i.test(serialized), false);
    assert.deepEqual((JSON.parse(serialized) as StudioBrowserSnapshot).files, {});
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("complete snapshot requires and serves only declared project outputs", async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "aftermark-complete-snapshot-"));
  try {
    await mkdir(path.join(projectRoot, "assets"));
    await mkdir(path.join(projectRoot, "output"));
    await Promise.all([
      writeFile(path.join(projectRoot, "assets/source.png"), "source"),
      writeFile(path.join(projectRoot, "assets/outer-art.png"), "outer"),
      writeFile(path.join(projectRoot, "output/record.png"), "record"),
      writeFile(path.join(projectRoot, "output/share-card.png"), "share"),
    ]);
    const request = parseStudioRequest(requestValue(), session);
    const status: AftermarkStudioStatus = {
      schemaVersion: "aftermark-status-v1",
      sessionId: session.sessionId,
      state: "complete",
      updatedAt: "2026-09-12T12:02:00.000Z",
      output: {
        recordPath: "output/record.png",
        shareCardPath: "output/share-card.png",
        outerArtPath: "assets/outer-art.png",
        recordType: "AFTERGLOW",
        catalogNumber: "NS-260912-001",
        renderedAt: "2026-09-12T12:02:00.000Z",
      },
    };
    const snapshot = await createStudioBrowserSnapshot({ projectRoot, session, status, request });
    assert.equal(snapshot.files.record, "/api/studio/files/record");
    assert.equal(snapshot.files.shareCard, "/api/studio/files/share-card");
    assert.equal(snapshot.files.source, "/api/studio/files/source");
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test("localhost guard rejects remote and cross-origin requests", () => {
  assert.doesNotThrow(() => assertLocalStudioRequest(new Request("http://127.0.0.1:3000/api/studio/session")));
  assert.doesNotThrow(() => assertLocalStudioRequest(new Request("http://localhost:3000/api/studio/request", {
    headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "cross-site" },
  })));
  assert.throws(() => assertLocalStudioRequest(new Request("http://example.com/api/studio/session")), /localhost/);
  assert.throws(() => assertLocalStudioRequest(new Request("http://127.0.0.1:3000/api/studio/session", {
    headers: { origin: "https://example.com" },
  })), /Cross-origin/);
});
