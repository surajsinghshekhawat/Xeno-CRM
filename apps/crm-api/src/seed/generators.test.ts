import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FIXED_SEED_REFERENCE_DATE,
  generateSeedData,
} from "./generators.js";

describe("generateSeedData", () => {
  it("produces deterministic output when SEED_ONLY reference date is fixed", () => {
    const first = generateSeedData({
      seedOnly: true,
      referenceDate: FIXED_SEED_REFERENCE_DATE,
    });
    const second = generateSeedData({
      seedOnly: true,
      referenceDate: FIXED_SEED_REFERENCE_DATE,
    });

    assert.equal(first.customers.length, 200);
    assert.equal(second.customers.length, 200);
    assert.equal(first.orders.length, second.orders.length);
    assert.equal(first.customers[0]?.email, second.customers[0]?.email);
    assert.equal(
      first.orders[0]?.createdAt.toISOString(),
      second.orders[0]?.createdAt.toISOString(),
    );
    assert.equal(first.campaigns[0]?.name, "Summer Win-Back");
    assert.equal(
      first.campaigns[0]?.createdAt.toISOString(),
      second.campaigns[0]?.createdAt.toISOString(),
    );
  });

  it("keeps order count within 500-700", () => {
    const { orders } = generateSeedData({
      seedOnly: true,
      referenceDate: FIXED_SEED_REFERENCE_DATE,
    });

    assert.ok(orders.length >= 500);
    assert.ok(orders.length <= 700);
  });

  it("creates five campaign specs without pre-assigned recipients", () => {
    const { campaigns } = generateSeedData({
      seedOnly: true,
      referenceDate: FIXED_SEED_REFERENCE_DATE,
    });

    assert.equal(campaigns.length, 5);
    assert.ok(campaigns.some((c) => c.name === "Summer Win-Back"));
  });
});
