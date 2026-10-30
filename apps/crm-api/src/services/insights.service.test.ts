import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Insight } from "@xeno/shared";
import { INSIGHT_PRIORITY, pickPrimaryInsight } from "./insights.service.js";

function makeInsight(type: Insight["type"], priority: number): Insight {
  return {
    id: type.toLowerCase(),
    type,
    priority,
    title: type,
    message: "test",
    cta: {
      label: "Go",
      action: "start_campaign",
      context: { goal: "test" },
    },
  };
}

describe("pickPrimaryInsight", () => {
  it("returns highest priority insight", () => {
    const selected = pickPrimaryInsight([
      makeInsight("NEW_WELCOME", INSIGHT_PRIORITY.NEW_WELCOME),
      makeInsight("LAPSED_WINBACK", INSIGHT_PRIORITY.LAPSED_WINBACK),
    ]);

    assert.equal(selected?.type, "LAPSED_WINBACK");
  });

  it("returns null when no candidates", () => {
    assert.equal(pickPrimaryInsight([]), null);
  });
});
