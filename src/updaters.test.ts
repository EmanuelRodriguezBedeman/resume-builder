import { describe, expect, test } from "vitest";
import type { Resume } from "./types.ts";
import {
  withCategorizedTagsItem,
  withCompactGridItem,
  withDescriptionBlock,
  withHeaderItem,
  withHeaderName,
  withSectionTitle,
  withShowcaseItem,
  withShowcaseLink,
  withShowcaseLinkAdded,
  withShowcaseLinkRemoved,
  withTagAdded,
  withTagRemoved,
  withTimelineItem,
} from "./updaters.ts";

const baseResume: Resume = {
  schemaVersion: 1,
  header: {
    name: "Original",
    items: [
      { id: "mail", icon: "mail", text: "a@b.c" },
      { id: "gh", icon: "github", text: "github.com/x", href: "https://github.com/x" },
    ],
  },
  sections: [
    {
      id: "exp",
      type: "timeline",
      title: "Experience",
      hidden: false,
      items: [
        {
          id: "t1",
          title: "Acme",
          subtitle: "ENGINEER",
          dateRange: { start: "2024-01", end: null },
          description: [
            { type: "paragraph", text: "Did stuff." },
            { type: "bullet", text: "Bullet one." },
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
        { id: "e1", title: "University", subtitle: "BSC" },
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
          title: "Project A",
          techStack: ["TS"],
          description: [{ type: "paragraph", text: "Cool." }],
          links: [{ id: "repo", icon: "github", label: "Repository", href: "https://x" }],
        },
      ],
    },
    {
      id: "skills",
      type: "categorizedTags",
      title: "Skills",
      hidden: false,
      items: [{ id: "s1", category: "Primary", tags: ["A", "B", "C"] }],
    },
  ],
};

describe("Header updaters", () => {
  test("withHeaderName changes name only", () => {
    const next = withHeaderName(baseResume, "New");
    expect(next.header.name).toBe("New");
    expect(next.header.items).toEqual(baseResume.header.items);
    expect(next.sections).toEqual(baseResume.sections);
  });

  test("withHeaderItem patches a single item", () => {
    const next = withHeaderItem(baseResume, "mail", { text: "new@b.c" });
    expect(next.header.items[0]).toEqual({
      id: "mail",
      icon: "mail",
      text: "new@b.c",
    });
    expect(next.header.items[1]).toEqual(baseResume.header.items[1]);
  });
});

describe("Section title updater", () => {
  test("withSectionTitle changes title on matching section only", () => {
    const next = withSectionTitle(baseResume, "exp", "Work History");
    expect(next.sections[0]?.title).toBe("Work History");
    expect(next.sections[1]).toEqual(baseResume.sections[1]);
  });
});

describe("Timeline item updater", () => {
  test("withTimelineItem patches fields on matching item only", () => {
    const next = withTimelineItem(baseResume, "exp", "t1", {
      title: "Adia",
      dateRange: { start: "2025-01", end: "2025-12" },
    });
    const section = next.sections[0];
    if (!section || section.type !== "timeline") throw new Error("wrong section");
    expect(section.items[0]?.title).toBe("Adia");
    expect(section.items[0]?.dateRange).toEqual({ start: "2025-01", end: "2025-12" });
    expect(section.items[0]?.subtitle).toBe("ENGINEER");
  });

  test("is a no-op when section type does not match", () => {
    const next = withTimelineItem(baseResume, "edu", "e1", { title: "X" });
    expect(next).toEqual(baseResume);
  });
});

describe("CompactGrid item updater", () => {
  test("withCompactGridItem patches fields", () => {
    const next = withCompactGridItem(baseResume, "edu", "e1", { title: "MIT" });
    const section = next.sections[1];
    if (!section || section.type !== "compactGrid") throw new Error("wrong section");
    expect(section.items[0]?.title).toBe("MIT");
  });
});

describe("Showcase item updater", () => {
  test("withShowcaseItem patches fields", () => {
    const next = withShowcaseItem(baseResume, "proj", "p1", {
      title: "Project B",
      techStack: ["TS", "React"],
    });
    const section = next.sections[2];
    if (!section || section.type !== "showcase") throw new Error("wrong section");
    expect(section.items[0]?.title).toBe("Project B");
    expect(section.items[0]?.techStack).toEqual(["TS", "React"]);
  });

  test("withShowcaseLinkAdded appends to the links array", () => {
    const next = withShowcaseLinkAdded(baseResume, "proj", "p1", {
      id: "demo",
      icon: "link",
      label: "Demo",
      href: "https://demo",
    });
    const section = next.sections[2];
    if (!section || section.type !== "showcase") throw new Error("wrong section");
    expect(section.items[0]?.links.length).toBe(2);
    expect(section.items[0]?.links[1]?.id).toBe("demo");
  });

  test("withShowcaseLinkRemoved drops the matching link", () => {
    const next = withShowcaseLinkRemoved(baseResume, "proj", "p1", "repo");
    const section = next.sections[2];
    if (!section || section.type !== "showcase") throw new Error("wrong section");
    expect(section.items[0]?.links).toEqual([]);
  });

  test("withShowcaseLink patches a single link", () => {
    const next = withShowcaseLink(baseResume, "proj", "p1", "repo", {
      label: "Source",
    });
    const section = next.sections[2];
    if (!section || section.type !== "showcase") throw new Error("wrong section");
    expect(section.items[0]?.links[0]?.label).toBe("Source");
    expect(section.items[0]?.links[0]?.href).toBe("https://x");
  });
});

describe("CategorizedTags updaters", () => {
  test("withCategorizedTagsItem patches category", () => {
    const next = withCategorizedTagsItem(baseResume, "skills", "s1", {
      category: "Languages",
    });
    const section = next.sections[3];
    if (!section || section.type !== "categorizedTags")
      throw new Error("wrong section");
    expect(section.items[0]?.category).toBe("Languages");
    expect(section.items[0]?.tags).toEqual(["A", "B", "C"]);
  });

  test("withTagAdded appends a tag", () => {
    const next = withTagAdded(baseResume, "skills", "s1", "D");
    const section = next.sections[3];
    if (!section || section.type !== "categorizedTags")
      throw new Error("wrong section");
    expect(section.items[0]?.tags).toEqual(["A", "B", "C", "D"]);
  });

  test("withTagRemoved drops the tag at the index", () => {
    const next = withTagRemoved(baseResume, "skills", "s1", 1);
    const section = next.sections[3];
    if (!section || section.type !== "categorizedTags")
      throw new Error("wrong section");
    expect(section.items[0]?.tags).toEqual(["A", "C"]);
  });
});

describe("Description block updater", () => {
  test("withDescriptionBlock patches the right block", () => {
    const next = withDescriptionBlock(baseResume, "exp", "t1", 0, {
      text: "Updated paragraph.",
    });
    const section = next.sections[0];
    if (!section || section.type !== "timeline") throw new Error("wrong section");
    expect(section.items[0]?.description[0]?.text).toBe("Updated paragraph.");
    expect(section.items[0]?.description[1]?.text).toBe("Bullet one.");
  });

  test("works on showcase items too", () => {
    const next = withDescriptionBlock(baseResume, "proj", "p1", 0, {
      text: "Updated cool.",
    });
    const section = next.sections[2];
    if (!section || section.type !== "showcase") throw new Error("wrong section");
    expect(section.items[0]?.description[0]?.text).toBe("Updated cool.");
  });
});
