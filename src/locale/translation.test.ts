import { describe, expect, test } from "vitest";
import { hashText, isFieldStale, tpath } from "./translation.ts";

describe("hashText", () => {
  test("is deterministic for the same input", () => {
    expect(hashText("Adia Health")).toBe(hashText("Adia Health"));
  });

  test("differs for different inputs", () => {
    expect(hashText("foo")).not.toBe(hashText("bar"));
  });

  test("handles empty string", () => {
    expect(typeof hashText("")).toBe("string");
  });
});

describe("isFieldStale", () => {
  test("is not stale when hashes are undefined (never been synced)", () => {
    expect(isFieldStale(undefined, "es", "anything")).toBe(false);
  });

  test("is not stale when the recorded slot is absent", () => {
    expect(isFieldStale({ en: "abc" }, "es", "anything")).toBe(false);
  });

  test("is not stale when recorded hash matches the peer value", () => {
    const peer = "Hello";
    expect(isFieldStale({ es: hashText(peer) }, "es", peer)).toBe(false);
  });

  test("is stale when recorded hash diverges from the peer value", () => {
    expect(isFieldStale({ es: hashText("old EN") }, "es", "new EN")).toBe(true);
  });
});

describe("tpath", () => {
  test("is derived from IDs only (stable across runs)", () => {
    expect(tpath.sectionTitle("exp")).toBe("section:exp:title");
    expect(tpath.timelineItemSubtitle("exp", "i1")).toBe(
      "section:exp:item:i1:subtitle",
    );
    expect(tpath.descriptionBlockText("exp", "i1", 0)).toBe(
      "section:exp:item:i1:block:0:text",
    );
    expect(tpath.showcaseLinkLabel("proj", "p1", "lk")).toBe(
      "section:proj:item:p1:link:lk:label",
    );
  });
});
