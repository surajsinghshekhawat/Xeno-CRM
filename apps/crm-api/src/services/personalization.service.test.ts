import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { personalizeMessage } from "./personalization.service.js";

describe("personalizeMessage", () => {
  it("substitutes customer first name", () => {
    const message = personalizeMessage("Hey {name}, welcome!", {
      name: "Priya Mehta",
      tag: "REGULAR",
    });
    assert.equal(message, "Hey Priya, welcome!");
  });

  it("applies VIP tone variant", () => {
    const message = personalizeMessage("Hey {name}! Check this out.", {
      name: "Rahul Singh",
      tag: "VIP",
    });
    assert.match(message, /Hi Rahul/);
    assert.match(message, /valued member/);
  });
});
