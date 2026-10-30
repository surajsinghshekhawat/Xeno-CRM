import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCsvContent } from "./csv-import.service.js";

describe("parseCsvContent", () => {
  it("parses valid CSV rows", () => {
    const csv = `name,email,phone,city,ageGroup,gender
Priya Mehta,priya@example.com,+919876543210,Mumbai,25-34,Female`;

    const rows = parseCsvContent(csv);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.data?.name, "Priya Mehta");
    assert.equal(rows[0]?.data?.email, "priya@example.com");
  });

  it("returns row-level validation errors", () => {
    const csv = `name,email
,bad-email`;

    const rows = parseCsvContent(csv);
    assert.equal(rows.length, 1);
    assert.ok(rows[0]?.errors?.length);
  });

  it("requires name and email headers", () => {
    const rows = parseCsvContent("phone,city\n+91,Delhi");
    assert.match(rows[0]?.errors?.[0] ?? "", /name and email/i);
  });
});
