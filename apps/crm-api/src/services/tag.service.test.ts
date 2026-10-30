import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSegmentFilters } from "./segment.service.js";
import {
  computeCustomerTag,
  daysSince,
  isSpendDeclining,
} from "./tag.service.js";

const ref = new Date("2025-06-15T12:00:00Z");
const daysAgo = (days: number) =>
  new Date(ref.getTime() - days * 24 * 60 * 60 * 1000);

describe("computeCustomerTag", () => {
  it("returns VIP when isVip is set", () => {
    assert.equal(
      computeCustomerTag(
        { orderCount: 5, lastPurchaseAt: daysAgo(10), totalSpend: 5000 },
        { isVip: true, referenceDate: ref },
      ),
      "VIP",
    );
  });

  it("returns NEW for single-order customers", () => {
    assert.equal(
      computeCustomerTag(
        { orderCount: 1, lastPurchaseAt: daysAgo(90), totalSpend: 2000 },
        { referenceDate: ref },
      ),
      "NEW",
    );
  });

  it("returns NEW when first purchase is within 30 days (not last purchase)", () => {
    assert.equal(
      computeCustomerTag(
        {
          orderCount: 3,
          lastPurchaseAt: daysAgo(5),
          totalSpend: 8000,
          orders: [
            { totalValue: 2000, createdAt: daysAgo(20), status: "COMPLETED" },
            { totalValue: 3000, createdAt: daysAgo(12), status: "COMPLETED" },
            { totalValue: 3000, createdAt: daysAgo(5), status: "COMPLETED" },
          ],
        },
        { referenceDate: ref },
      ),
      "NEW",
    );
  });

  it("returns REGULAR for repeat buyers with first purchase older than 30 days", () => {
    assert.equal(
      computeCustomerTag(
        {
          orderCount: 3,
          lastPurchaseAt: daysAgo(10),
          totalSpend: 12000,
          orders: [
            { totalValue: 4000, createdAt: daysAgo(120), status: "COMPLETED" },
            { totalValue: 4000, createdAt: daysAgo(60), status: "COMPLETED" },
            { totalValue: 4000, createdAt: daysAgo(10), status: "COMPLETED" },
          ],
        },
        { referenceDate: ref },
      ),
      "REGULAR",
    );
  });

  it("returns LAPSED when last purchase is 60+ days ago", () => {
    assert.equal(
      computeCustomerTag(
        {
          orderCount: 4,
          lastPurchaseAt: daysAgo(90),
          totalSpend: 10000,
          orders: [
            { totalValue: 2500, createdAt: daysAgo(400), status: "COMPLETED" },
            { totalValue: 2500, createdAt: daysAgo(300), status: "COMPLETED" },
            { totalValue: 2500, createdAt: daysAgo(200), status: "COMPLETED" },
            { totalValue: 2500, createdAt: daysAgo(90), status: "COMPLETED" },
          ],
        },
        { referenceDate: ref },
      ),
      "LAPSED",
    );
  });

  it("returns AT_RISK for 30-60 day gap with declining spend", () => {
    assert.equal(
      computeCustomerTag(
        {
          orderCount: 3,
          lastPurchaseAt: daysAgo(45),
          totalSpend: 15000,
          orders: [
            { totalValue: 8000, createdAt: daysAgo(200), status: "COMPLETED" },
            { totalValue: 6000, createdAt: daysAgo(100), status: "COMPLETED" },
            { totalValue: 1000, createdAt: daysAgo(45), status: "COMPLETED" },
          ],
        },
        { referenceDate: ref },
      ),
      "AT_RISK",
    );
  });
});

describe("isSpendDeclining", () => {
  it("detects decline when recent spend is below 70% of prior window", () => {
    const declining = isSpendDeclining(
      [
        { totalValue: 10000, createdAt: daysAgo(90), status: "COMPLETED" },
        { totalValue: 1000, createdAt: daysAgo(45), status: "COMPLETED" },
      ],
      ref,
    );
    assert.equal(declining, true);
  });
});

describe("parseSegmentFilters", () => {
  it("accepts valid filter objects", () => {
    const filters = parseSegmentFilters({ spendMin: 1000, tags: ["VIP"] });
    assert.equal(filters.spendMin, 1000);
    assert.deepEqual(filters.tags, ["VIP"]);
  });

  it("rejects unknown keys", () => {
    assert.throws(() => parseSegmentFilters({ unknown: true }));
  });
});

describe("daysSince", () => {
  it("returns whole days between dates", () => {
    assert.equal(daysSince(daysAgo(10), ref), 10);
  });
});
