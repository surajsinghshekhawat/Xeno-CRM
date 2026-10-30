import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransition,
  eventToStatus,
  isDuplicateEvent,
} from "./recipient-state-machine.js";

describe("recipient-state-machine", () => {
  it("maps events to statuses", () => {
    assert.equal(eventToStatus("delivered"), "DELIVERED");
    assert.equal(eventToStatus("failed"), "FAILED");
    assert.equal(eventToStatus("converted"), "CONVERTED");
  });

  it("allows SENT to DELIVERED", () => {
    assert.equal(canTransition("SENT", "DELIVERED"), true);
  });

  it("allows FAILED to DELIVERED on retry", () => {
    assert.equal(canTransition("FAILED", "DELIVERED"), true);
  });

  it("rejects DELIVERED to SENT", () => {
    assert.equal(canTransition("DELIVERED", "SENT"), false);
  });

  it("treats duplicate delivered as idempotent", () => {
    assert.equal(isDuplicateEvent("DELIVERED", "delivered"), true);
    assert.equal(isDuplicateEvent("OPENED", "delivered"), true);
  });

  it("allows failed after sent", () => {
    assert.equal(isDuplicateEvent("SENT", "failed"), false);
    assert.equal(canTransition("SENT", "FAILED"), true);
  });
});
