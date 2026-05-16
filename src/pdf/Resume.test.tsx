import { describe, expect, test } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { Resume } from "./Resume.tsx";
import type { Resume as ResumeType } from "../types.ts";

async function renderPdf(resume: ResumeType): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await pdf(<Resume resume={resume} /> as any).toBuffer()) as unknown;
  // @react-pdf/renderer.toBuffer() returns a Readable stream in Node;
  // drain it into one Buffer for assertions.
  if (Buffer.isBuffer(result)) return result;
  const chunks: Uint8Array[] = [];
  for await (const chunk of result as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const headerOnlySample: ResumeType = {
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

const allSectionTypesSample: ResumeType = {
  schemaVersion: 1,
  header: { name: "Test", items: [] },
  sections: [
    {
      id: "exp",
      type: "timeline",
      title: "Experience",
      hidden: false,
      items: [
        {
          id: "t1",
          title: "Acme Co",
          subtitle: "SOFTWARE ENGINEER",
          dateRange: { start: "2024-03", end: null },
          description: [
            { type: "paragraph", text: "Built things." },
            { type: "bullet", text: "Did one." },
            { type: "bullet", leadIn: "Highlight", text: "Did another." },
          ],
        },
      ],
    },
    {
      id: "edu",
      type: "compactGrid",
      title: "Education",
      hidden: false,
      items: [
        {
          id: "e1",
          title: "University",
          subtitle: "BSC",
          date: { start: "2018", end: "2022" },
        },
        { id: "e2", title: "Bootcamp", date: { start: "2023-01" } },
      ],
    },
    {
      id: "proj",
      type: "showcase",
      title: "Projects",
      hidden: false,
      items: [
        {
          id: "p1",
          title: "Cool Project",
          techStack: ["TypeScript", "React"],
          description: [{ type: "paragraph", text: "It does cool things." }],
          links: [
            {
              id: "repo",
              icon: "github",
              label: "Repository",
              href: "https://github.com/x/y",
            },
          ],
        },
      ],
    },
    {
      id: "skills",
      type: "categorizedTags",
      title: "Skills",
      hidden: false,
      items: [
        { id: "s1", category: "Primary", tags: ["TS", "React", "Node"] },
        { id: "s2", category: "Databases", tags: ["Postgres"] },
      ],
    },
  ],
};

describe("Resume PDF render (smoke)", () => {
  test("renders header-only Resume to a valid PDF buffer", async () => {
    const buffer = await renderPdf(headerOnlySample);
    expect(buffer.length).toBeGreaterThan(1500);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("renders Resume with one item of each Section type without error", async () => {
    const buffer = await renderPdf(allSectionTypesSample);
    expect(buffer.length).toBeGreaterThan(2000);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  test("hidden sections are skipped without throwing", async () => {
    const sample: ResumeType = {
      ...allSectionTypesSample,
      sections: allSectionTypesSample.sections.map((s) => ({ ...s, hidden: true })),
    };
    const buffer = await renderPdf(sample);
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
  });
});
