import assert from "node:assert/strict";
import test from "node:test";
import { countUserMessage, validateUserMessage } from "../src/lib/message-validation";

test("counts space-separated words and enforces the 30-word limit", () => {
  assert.equal(countUserMessage("we were here"), 3);
  assert.equal(validateUserMessage(Array.from({ length: 30 }, () => "mark").join(" ")).valid, true);
  assert.equal(validateUserMessage(Array.from({ length: 31 }, () => "mark").join(" ")).valid, false);
});

test("counts CJK characters and mixed-language words with the same limit", () => {
  assert.equal(countUserMessage("我们在这里"), 5);
  assert.equal(countUserMessage("我们 after dark"), 4);
  assert.equal(validateUserMessage("留".repeat(30)).valid, true);
  assert.equal(validateUserMessage("留".repeat(31)).valid, false);
});
