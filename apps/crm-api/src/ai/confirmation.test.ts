import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectUserApproval } from "./confirmation.js";

describe("detectUserApproval", () => {
  it("detects approval phrases", () => {
    assert.equal(detectUserApproval("yes, launch it"), "approve");
    assert.equal(detectUserApproval("go ahead"), "approve");
  });

  it("detects rejection", () => {
    assert.equal(detectUserApproval("no wait"), "reject");
  });

  it("returns neutral for ambiguous text", () => {
    assert.equal(detectUserApproval("tell me more"), "neutral");
  });
});
