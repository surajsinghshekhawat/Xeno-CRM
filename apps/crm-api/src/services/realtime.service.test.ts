import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCampaignProgress,
  emitRecipientUpdate,
  statusesToGroups,
} from "./realtime.service.js";

describe("statusesToGroups", () => {
  it("groups recipient statuses for progress metrics", () => {
    const groups = statusesToGroups(["DELIVERED", "DELIVERED", "SENT"]);
    assert.equal(groups.length, 2);
    const delivered = groups.find((group) => group.status === "DELIVERED");
    assert.equal(delivered?._count.status, 2);
  });
});

describe("buildCampaignProgress", () => {
  it("computes terminal progress percent", () => {
    const progress = buildCampaignProgress("camp-1", "SENDING", [
      { status: "DELIVERED", _count: { status: 3 } },
      { status: "FAILED", _count: { status: 1 } },
      { status: "SENT", _count: { status: 2 } },
    ]);

    assert.equal(progress.progressPercent, 66.7);
    assert.equal(progress.terminalCount, 4);
    assert.equal(progress.total, 6);
    assert.equal(progress.metrics.counts.delivered, 3);
  });

  it("returns 0 progress when no recipients", () => {
    const progress = buildCampaignProgress("camp-1", "DRAFT", []);
    assert.equal(progress.progressPercent, 0);
    assert.equal(progress.total, 0);
  });
});

describe("emitRecipientUpdate latency", () => {
  it("emits recipient update synchronously within 500ms", () => {
    const start = performance.now();
    emitRecipientUpdate({
      campaignId: "camp-1",
      recipientId: "rec-1",
      status: "DELIVERED",
      event: "delivered",
      timestamp: new Date().toISOString(),
      duplicate: false,
    });
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 500, `expected sync emit <500ms, got ${elapsed}ms`);
  });
});
