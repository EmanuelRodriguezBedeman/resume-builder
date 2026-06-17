import { describe, expect, test } from "vitest";
import type {
  CategorizedTagsSection,
  Header,
  Resume,
  ShowcaseSection,
  TimelineSection,
} from "../types.ts";
import {
  ACTION_VERBS,
  MAX_SCORE,
  MIN_ACTION_VERB_RATIO,
  MIN_AVG_WORDS,
  scoreResume,
  WEIGHTS,
} from "./score.ts";

// -- Fixtures -----------------------------------------------------------
//
// `perfectResume()` ticks every criterion (→ 100). Each test mutates one
// facet and asserts the delta equals exactly that criterion's weight, which
// keeps the criteria decoupled.

const completeHeader = (): Header => ({
  name: "Ada Lovelace",
  items: [
    { id: "h1", icon: "mail", text: "ada@example.com" },
    { id: "h2", icon: "phone", text: "+1 555 0100" },
  ],
});

// A 30+ word, action-verb-led, quantified bullet block.
const strongBlock = (verb: string) => ({
  type: "bullet" as const,
  text: `${verb} a distributed billing platform that processed over 2 million transactions per day, reduced p99 latency by 40 percent, and supported twelve regional teams across three continents without downtime`,
});

const timelineSection = (): TimelineSection => ({
  id: "exp",
  title: "Experience",
  hidden: false,
  type: "timeline",
  items: [
    {
      id: "t1",
      title: "Acme Corp",
      subtitle: "Senior Engineer",
      dateRange: { start: "2020-01", end: null },
      description: [strongBlock("Led"), strongBlock("Built")],
    },
  ],
});

const showcaseSection = (): ShowcaseSection => ({
  id: "proj",
  title: "Projects",
  hidden: false,
  type: "showcase",
  items: [
    {
      id: "p1",
      title: "Telemetry Pipeline",
      techStack: ["Rust", "Kafka"],
      description: [strongBlock("Designed")],
      links: [{ id: "l1", icon: "github", label: "Source" }],
    },
  ],
});

const skillsSection = (): CategorizedTagsSection => ({
  id: "skills",
  title: "Skills",
  hidden: false,
  type: "categorizedTags",
  items: [{ id: "s1", category: "Primary", tags: ["TypeScript", "Go"] }],
});

const perfectResume = (): Resume => ({
  schemaVersion: 1,
  header: completeHeader(),
  sections: [timelineSection(), showcaseSection(), skillsSection()],
});

describe("WEIGHTS", () => {
  test("sum to MAX_SCORE (100)", () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(MAX_SCORE);
    expect(MAX_SCORE).toBe(100);
  });
});

describe("scoreResume", () => {
  test("a complete, strong résumé scores 100", () => {
    expect(scoreResume(perfectResume(), "en")).toBe(100);
  });

  test("returns within 0–100", () => {
    const s = scoreResume(perfectResume(), "en");
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  test("an empty résumé scores low (only vacuous criteria pass)", () => {
    const empty: Resume = {
      schemaVersion: 1,
      header: { name: "", items: [] },
      sections: [],
    };
    // No hidden sections (vacuous) + translatable complete (vacuous).
    expect(scoreResume(empty, "en")).toBe(
      WEIGHTS.noHiddenSections + WEIGHTS.translatableComplete,
    );
  });

  test("is pure — does not mutate its input", () => {
    const r = perfectResume();
    const snapshot = JSON.stringify(r);
    scoreResume(r, "en");
    expect(JSON.stringify(r)).toBe(snapshot);
  });
});

describe("header criterion", () => {
  test("missing name forfeits the header weight", () => {
    const r = perfectResume();
    r.header.name = "  ";
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.header);
  });

  test("missing email forfeits the header weight", () => {
    const r = perfectResume();
    r.header.items = r.header.items.filter((i) => i.icon !== "mail");
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.header);
  });

  test("email but no second contact forfeits the header weight", () => {
    const r = perfectResume();
    r.header.items = [{ id: "h1", icon: "mail", text: "ada@example.com" }];
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.header);
  });
});

describe("key-sections criterion", () => {
  test("timeline alone is insufficient", () => {
    const r: Resume = {
      schemaVersion: 1,
      header: completeHeader(),
      sections: [timelineSection()],
    };
    const withSkills: Resume = { ...r, sections: [timelineSection(), skillsSection()] };
    expect(scoreResume(withSkills, "en") - scoreResume(r, "en")).toBe(
      WEIGHTS.keySections,
    );
  });

  test("timeline + categorizedTags satisfies it (no showcase needed)", () => {
    const r: Resume = {
      schemaVersion: 1,
      header: completeHeader(),
      sections: [timelineSection(), skillsSection()],
    };
    // keySections must be among the awarded criteria.
    const without: Resume = { ...r, sections: [skillsSection()] };
    expect(scoreResume(r, "en") - scoreResume(without, "en")).toBeGreaterThanOrEqual(
      WEIGHTS.keySections,
    );
  });
});

describe("description-density criterion", () => {
  test("thin descriptions (< MIN_AVG_WORDS) forfeit the weight", () => {
    const r = perfectResume();
    // Verb-led and quantified, just short — so only density forfeits.
    (r.sections[0] as TimelineSection).items[0].description = [
      { type: "paragraph", text: "Led 3 teams." },
      { type: "paragraph", text: "Built 2 services." },
    ];
    (r.sections[1] as ShowcaseSection).items[0].description = [
      { type: "paragraph", text: "Designed 1 API." },
    ];
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.descriptionDensity);
  });

  test("threshold counts both bullet text and lead-in words", () => {
    expect(MIN_AVG_WORDS).toBe(30);
  });
});

describe("action-verb criterion", () => {
  test("non-verb openers forfeit the weight", () => {
    const r = perfectResume();
    const dull = (text: string) => ({ type: "paragraph" as const, text });
    const longTail =
      "the platform processed over 2 million transactions per day and reduced latency by 40 percent across twelve teams on three continents without any downtime at all";
    (r.sections[0] as TimelineSection).items[0].description = [
      dull(`Responsible for ${longTail}`),
      dull(`Accountable for ${longTail}`),
    ];
    (r.sections[1] as ShowcaseSection).items[0].description = [
      dull(`Helped with ${longTail}`),
    ];
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.actionVerbs);
  });

  test("Spanish verbs score an es résumé", () => {
    const r = perfectResume();
    const esBlock = {
      type: "bullet" as const,
      text: "lideré una plataforma de facturación distribuida que procesó más de 2 millones de transacciones por día y redujo la latencia en un 40 por ciento para doce equipos regionales en tres continentes sin interrupciones",
    };
    (r.sections[0] as TimelineSection).items[0].description = [esBlock, esBlock];
    (r.sections[1] as ShowcaseSection).items[0].description = [esBlock];
    expect(scoreResume(r, "es")).toBe(100);
    // The same Spanish openers do NOT match the English verb set.
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.actionVerbs);
  });

  test("a bullet's bold lead-in counts as the opener", () => {
    const r = perfectResume();
    const tail =
      "the global billing platform across twelve regional teams and three continents handling 2 million daily transactions and cutting costs 40 percent without downtime";
    (r.sections[0] as TimelineSection).items[0].description = [
      { type: "bullet", leadIn: "Shipped", text: tail },
      { type: "bullet", leadIn: "Scaled", text: tail },
    ];
    (r.sections[1] as ShowcaseSection).items[0].description = [
      { type: "bullet", leadIn: "Automated", text: tail },
    ];
    expect(scoreResume(r, "en")).toBe(100);
  });

  test("ratio threshold is exactly half", () => {
    expect(MIN_ACTION_VERB_RATIO).toBe(0.5);
  });
});

describe("quantified-achievements criterion", () => {
  test("descriptions with no digits or % forfeit the weight", () => {
    const r = perfectResume();
    const noNumbers =
      "Led a distributed billing platform that processed many transactions per day reduced latency considerably and supported numerous regional teams across several continents without downtime";
    (r.sections[0] as TimelineSection).items[0].description = [
      { type: "paragraph", text: noNumbers },
      { type: "paragraph", text: noNumbers },
    ];
    (r.sections[1] as ShowcaseSection).items[0].description = [
      { type: "paragraph", text: noNumbers },
    ];
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.quantifiedAchievements);
  });
});

describe("hidden-sections criterion", () => {
  test("a single hidden section forfeits the weight", () => {
    const r = perfectResume();
    r.sections[2].hidden = true;
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.noHiddenSections);
  });
});

describe("translatable-completeness criterion", () => {
  test("an empty section title forfeits the weight", () => {
    const r = perfectResume();
    r.sections[0].title = "";
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.translatableComplete);
  });

  test("an empty timeline subtitle forfeits the weight", () => {
    const r = perfectResume();
    (r.sections[0] as TimelineSection).items[0].subtitle = "  ";
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.translatableComplete);
  });

  test("an empty showcase-link label forfeits the weight", () => {
    const r = perfectResume();
    (r.sections[1] as ShowcaseSection).items[0].links[0].label = "";
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.translatableComplete);
  });

  test("an empty categorized-tags category forfeits the weight", () => {
    const r = perfectResume();
    (r.sections[2] as CategorizedTagsSection).items[0].category = "";
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.translatableComplete);
  });

  test("a defined-but-blank bullet lead-in forfeits the weight", () => {
    const r = perfectResume();
    (r.sections[0] as TimelineSection).items[0].description = [
      { type: "bullet", leadIn: "   ", text: strongBlock("Led").text },
      strongBlock("Built"),
    ];
    expect(scoreResume(r, "en")).toBe(100 - WEIGHTS.translatableComplete);
  });
});

describe("ACTION_VERBS", () => {
  test("includes the issue's English verbs", () => {
    for (const v of ["led", "built", "developed", "drove", "refactored"]) {
      expect(ACTION_VERBS.en.has(v)).toBe(true);
    }
  });
});
