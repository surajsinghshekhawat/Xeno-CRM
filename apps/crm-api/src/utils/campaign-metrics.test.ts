import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCampaignMetrics } from "../utils/campaign-metrics.js";

describe("computeCampaignMetrics", () => {
  it("calculates funnel rates from recipient statuses", () => {
    const metrics = computeCampaignMetrics([
      { status: "DELIVERED" },
      { status: "OPENED" },
      { status: "CLICKED" },
      { status: "CONVERTED" },
      { status: "FAILED" },
    ]);

    assert.equal(metrics.counts.total, 5);
    assert.equal(metrics.counts.delivered, 4);
    assert.equal(metrics.counts.opened, 3);
    assert.equal(metrics.counts.clicked, 2);
    assert.equal(metrics.counts.converted, 1);
    assert.equal(metrics.deliveryRate, 80);
    assert.equal(metrics.openRate, 75);
  });
});
