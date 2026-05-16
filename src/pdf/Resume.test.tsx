import { describe, expect, test } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { Resume } from "./Resume.tsx";
import type { Resume as ResumeType } from "../types.ts";

async function renderPdf(resume: ResumeType): Promise<Buffer> {
  // pdf() expects a Document element; cast around the strict typing since
  // <Resume> renders a Document internally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await pdf(<Resume resume={resume} /> as any).toBuffer()) as unknown;
  // In Node, @react-pdf/renderer's toBuffer() returns a Readable stream.
  // Drain it into a single Buffer for inspection.
  if (Buffer.isBuffer(result)) return result;
  const chunks: Uint8Array[] = [];
  for await (const chunk of result as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const sample: ResumeType = {
  schemaVersion: 1,
  header: {
    name: "Test Person",
    items: [
      { id: "mail", icon: "mail", text: "a@b.c", href: "mailto:a@b.c" },
      { id: "phone", icon: "phone", text: "+1 555 0123" },
      { id: "loc", icon: "map-pin", text: "Somewhere" },
      { id: "site", icon: "link", text: "example.com", href: "https://example.com" },
      { id: "gh", icon: "github", text: "github.com/x", href: "https://github.com/x" },
      { id: "li", icon: "linkedin", text: "linkedin.com/in/x", href: "https://linkedin.com/in/x" },
    ],
  },
  sections: [],
};

describe("Resume PDF render (smoke)", () => {
  test("renders to a non-empty PDF buffer with all 6 header icons", async () => {
    const buffer = await renderPdf(sample);
    expect(buffer.length).toBeGreaterThan(1500);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("renders even when header.items is empty (no icons used)", async () => {
    const minimal: ResumeType = {
      schemaVersion: 1,
      header: { name: "X", items: [] },
      sections: [],
    };
    const buffer = await renderPdf(minimal);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });
});
