import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { bootstrapSpanishFromEnglish } from "./bootstrap.ts";
import type { Resume } from "./storage.ts";

// Fixture exercises every section type so each branch of the walker is
// covered. Shared fields ("Adia Health", "Python", header items, IDs)
// must not be translated. Translatable fields ("Experience", subtitles,
// description blocks, project titles, link labels, categories) must.
const FIXTURE: Resume = {
  schemaVersion: 1,
  header: {
    name: "Emanuel Rodriguez Bedeman",
    items: [
      {
        id: "email",
        icon: "mail",
        text: "x@y.z",
        href: "mailto:x@y.z",
      },
    ],
  },
  sections: [
    {
      id: "experience",
      type: "timeline",
      title: "Experience",
      hidden: false,
      items: [
        {
          id: "adia-health",
          title: "Adia Health",
          subtitle: "DATA SCIENTIST",
          dateRange: { start: "2025-03", end: "2025-09" },
          description: [
            { type: "paragraph", text: "Did clinical analysis." },
            {
              type: "bullet",
              leadIn: "Prompt engineering",
              text: "Generated medical insights.",
            },
          ],
        },
      ],
    },
    {
      id: "education",
      type: "compactGrid",
      title: "Education",
      hidden: false,
      items: [
        {
          id: "uba",
          title: "Universidad de Buenos Aires",
          subtitle: "MEDICINE",
          date: { start: "2014", end: "2023" },
        },
      ],
    },
    {
      id: "skills",
      type: "categorizedTags",
      title: "Skills",
      hidden: false,
      items: [
        {
          id: "skills-primary",
          category: "Primary",
          tags: ["Python", "Pandas"],
        },
      ],
    },
    {
      id: "projects",
      type: "showcase",
      title: "Projects",
      hidden: false,
      items: [
        {
          id: "dengue",
          title: "Epidemiological Dashboard of Dengue",
          techStack: ["Looker Studio"],
          description: [{ type: "paragraph", text: "Innovative dashboard." }],
          links: [
            {
              id: "dashboard",
              icon: "bar-chart-3",
              label: "Dashboard",
              href: "https://example.test",
            },
          ],
        },
      ],
    },
  ],
};

function spStub(): ReturnType<typeof vi.fn> {
  // Stub DeepL fetch with a deterministic prefix so we can assert which
  // strings were translated without depending on real translation quality.
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(init?.body as string) as { text: string[] };
    const text = body.text[0] ?? "";
    return new Response(
      JSON.stringify({ translations: [{ text: `ES(${text})` }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
}

describe("bootstrapSpanishFromEnglish", () => {
  beforeEach(() => {
    // Silence the progress logs in test output.
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("falls back to a deep clone when DEEPL_API_KEY is unset", async () => {
    vi.stubEnv("DEEPL_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const warn = vi.spyOn(console, "warn");

    const es = await bootstrapSpanishFromEnglish(FIXTURE);

    expect(es).toEqual(FIXTURE);
    expect(es).not.toBe(FIXTURE); // deep clone, not the same reference
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("DEEPL_API_KEY not set"),
    );
  });

  test("translates only Translatable fields; Shared fields untouched", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    const fetchMock = spStub();
    vi.stubGlobal("fetch", fetchMock);

    const es = await bootstrapSpanishFromEnglish(FIXTURE);

    // Shared (must NOT be translated):
    expect(es.schemaVersion).toBe(1);
    expect(es.header).toEqual(FIXTURE.header);
    const exp = es.sections[0] as { id: string; items: Array<{ id: string; title: string; dateRange: unknown }> };
    expect(exp.id).toBe("experience");
    expect(exp.items[0]!.id).toBe("adia-health");
    expect(exp.items[0]!.title).toBe("Adia Health");
    expect(exp.items[0]!.dateRange).toEqual({ start: "2025-03", end: "2025-09" });

    const edu = es.sections[1] as { items: Array<{ title: string; date: unknown }> };
    expect(edu.items[0]!.title).toBe("Universidad de Buenos Aires");
    expect(edu.items[0]!.date).toEqual({ start: "2014", end: "2023" });

    const skills = es.sections[2] as { items: Array<{ tags: string[] }> };
    expect(skills.items[0]!.tags).toEqual(["Python", "Pandas"]);

    const projects = es.sections[3] as {
      items: Array<{ techStack: string[]; links: Array<{ href?: string; icon: string }> }>;
    };
    expect(projects.items[0]!.techStack).toEqual(["Looker Studio"]);
    expect(projects.items[0]!.links[0]!.href).toBe("https://example.test");
    expect(projects.items[0]!.links[0]!.icon).toBe("bar-chart-3");

    // Translatable (must be translated):
    const expTitle = (es.sections[0] as { title: string }).title;
    expect(expTitle).toBe("ES(Experience)");
    expect(exp.items[0]!).toMatchObject({ subtitle: "ES(DATA SCIENTIST)" });

    const expDesc = (exp.items[0] as unknown as { description: Array<{ text: string; leadIn?: string }> }).description;
    expect(expDesc[0]!.text).toBe("ES(Did clinical analysis.)");
    expect(expDesc[1]!.text).toBe("ES(Generated medical insights.)");
    expect(expDesc[1]!.leadIn).toBe("ES(Prompt engineering)");

    expect((es.sections[1] as { title: string }).title).toBe("ES(Education)");
    expect(edu.items[0]!).toMatchObject({ subtitle: "ES(MEDICINE)" });

    expect((es.sections[2] as { title: string }).title).toBe("ES(Skills)");
    expect(skills.items[0]!).toMatchObject({ category: "ES(Primary)" });

    expect((es.sections[3] as { title: string }).title).toBe("ES(Projects)");
    expect(projects.items[0]!).toMatchObject({
      title: "ES(Epidemiological Dashboard of Dengue)",
    });
    const projDesc = (projects.items[0] as unknown as { description: Array<{ text: string }> }).description;
    expect(projDesc[0]!.text).toBe("ES(Innovative dashboard.)");
    expect(projects.items[0]!.links[0]!).toMatchObject({ label: "ES(Dashboard)" });
  });

  test("does not call DeepL for empty or whitespace-only strings", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    const fetchMock = spStub();
    vi.stubGlobal("fetch", fetchMock);

    const en: Resume = {
      schemaVersion: 1,
      header: { name: "", items: [] },
      sections: [
        {
          id: "empty",
          type: "timeline",
          title: "",
          hidden: false,
          items: [
            {
              id: "x",
              title: "Proper Noun",
              subtitle: "   ",
              dateRange: { start: "2024-01", end: null },
              description: [],
            },
          ],
        },
      ] as unknown as Resume["sections"],
    };

    await bootstrapSpanishFromEnglish(en);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("tolerates per-field DeepL failures by keeping EN text", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    let calls = 0;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      calls += 1;
      const body = JSON.parse(init?.body as string) as { text: string[] };
      const text = body.text[0] ?? "";
      // Fail the second call only.
      if (calls === 2) {
        return new Response("boom", {
          status: 500,
          headers: { "content-type": "text/plain" },
        });
      }
      return new Response(
        JSON.stringify({ translations: [{ text: `ES(${text})` }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const en: Resume = {
      schemaVersion: 1,
      header: { name: "", items: [] },
      sections: [
        {
          id: "edu",
          type: "compactGrid",
          title: "Education",
          hidden: false,
          items: [
            { id: "a", title: "Inst A", subtitle: "FIRST" },
            { id: "b", title: "Inst B", subtitle: "SECOND" },
          ],
        },
      ] as unknown as Resume["sections"],
    };

    const es = await bootstrapSpanishFromEnglish(en);
    const items = (es.sections[0] as { items: Array<{ subtitle: string }> }).items;
    // First call (section title) → translated.
    expect((es.sections[0] as { title: string }).title).toBe("ES(Education)");
    // Second call (item[0].subtitle) → failed, EN kept.
    expect(items[0]!.subtitle).toBe("FIRST");
    // Third call (item[1].subtitle) → translated.
    expect(items[1]!.subtitle).toBe("ES(SECOND)");
  });

  test("does not mutate the input EN resume", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    vi.stubGlobal("fetch", spStub());

    const before = JSON.parse(JSON.stringify(FIXTURE)) as Resume;
    await bootstrapSpanishFromEnglish(FIXTURE);
    expect(FIXTURE).toEqual(before);
  });
});
