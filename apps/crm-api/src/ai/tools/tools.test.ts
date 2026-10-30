import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AI_TOOL_NAMES, aiToolSchemas } from "@xeno/shared";

describe("ai tool schemas", () => {
  it("defines all six PRD tools", () => {
    assert.equal(AI_TOOL_NAMES.length, 6);
    for (const name of AI_TOOL_NAMES) {
      assert.ok(aiToolSchemas[name]);
    }
  });

  it("blocks fireCampaign without confirmation in schema default", () => {
    const parsed = aiToolSchemas.fireCampaign.parse({
      segmentFilters: { tags: ["VIP"] },
      message: "Hi {name}!",
      channel: "WHATSAPP",
      campaignName: "VIP test",
    });
    assert.equal(parsed.confirmed, false);
  });
});
