import { describe, expect, test } from "vitest";
import type { Resume } from "./types.ts";
import {
  withCategorizedTagsItem,
  withCompactGridItem,
  withDescriptionBlock,
  withHeaderItem,
  withHeaderItemAdded,
  withHeaderItemRemoved,
  withHeaderName,
  withItemAdded,
  withItemRemoved,
  withItemsReordered,
  withSectionAdded,
  withSectionHiddenToggled,
  withSectionRemoved,
  withSectionsReordered,
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

describe("Header item add/remove updaters", () => {
  test("withHeaderItemAdded appends to the items array", () => {
    const next = withHeaderItemAdded(baseResume, {
      id: "x",
      icon: "link",
      text: "x.com",
    });
    expect(next.header.items.length).toBe(baseResume.header.items.length + 1);
    expect(next.header.items.at(-1)?.id).toBe("x");
  });

  test("withHeaderItemRemoved drops the matching item only", () => {
    const next = withHeaderItemRemoved(baseResume, "mail");
    expect(next.header.items.find((i) => i.id === "mail")).toBeUndefined();
    expect(next.header.items.find((i) => i.id === "gh")).toBeDefined();
  });
});

describe("Item add/remove updaters", () => {
  test("withItemAdded appends an empty item with the right shape per type", () => {
    const next = withItemAdded(baseResume, "exp", "new-t");
    const section = next.sections[0];
    if (!section || section.type !== "timeline") throw new Error("wrong section");
    expect(section.items.length).toBe(2);
    expect(section.items.at(-1)).toEqual({
      id: "new-t",
      title: "",
      subtitle: "",
      dateRange: { start: "", end: null },
      description: [],
    });
  });

  test("withItemAdded for compactGrid creates a minimal item", () => {
    const next = withItemAdded(baseResume, "edu", "new-e");
    const section = next.sections[1];
    if (!section || section.type !== "compactGrid") throw new Error("wrong section");
    expect(section.items.at(-1)).toEqual({ id: "new-e", title: "" });
  });

  test("withItemAdded for showcase creates an empty links/techStack/description", () => {
    const next = withItemAdded(baseResume, "proj", "new-p");
    const section = next.sections[2];
    if (!section || section.type !== "showcase") throw new Error("wrong section");
    expect(section.items.at(-1)).toEqual({
      id: "new-p",
      title: "",
      techStack: [],
      description: [],
      links: [],
    });
  });

  test("withItemAdded for categorizedTags creates empty tags", () => {
    const next = withItemAdded(baseResume, "skills", "new-s");
    const section = next.sections[3];
    if (!section || section.type !== "categorizedTags") throw new Error("wrong section");
    expect(section.items.at(-1)).toEqual({ id: "new-s", category: "", tags: [] });
  });

  test("withItemRemoved drops only the matching item", () => {
    const next = withItemRemoved(baseResume, "skills", "s1");
    const section = next.sections[3];
    if (!section || section.type !== "categorizedTags") throw new Error("wrong section");
    expect(section.items.length).toBe(0);
  });

  test("withItemRemoved is a no-op for unknown id", () => {
    const next = withItemRemoved(baseResume, "skills", "does-not-exist");
    expect(next).toEqual(baseResume);
  });
});

describe("Section add/remove updaters", () => {
  test("withSectionAdded appends an empty Section of the requested type", () => {
    const next = withSectionAdded(baseResume, "showcase", "new-id");
    expect(next.sections.length).toBe(baseResume.sections.length + 1);
    const added = next.sections.at(-1);
    expect(added?.id).toBe("new-id");
    expect(added?.type).toBe("showcase");
    expect(added?.items).toEqual([]);
    expect(added?.hidden).toBe(false);
  });

  test("withSectionAdded preserves existing sections in order", () => {
    const next = withSectionAdded(baseResume, "timeline", "x");
    expect(next.sections.slice(0, -1)).toEqual(baseResume.sections);
  });

  test("withSectionRemoved drops only the matching section", () => {
    const next = withSectionRemoved(baseResume, "edu");
    expect(next.sections.length).toBe(baseResume.sections.length - 1);
    expect(next.sections.find((s) => s.id === "edu")).toBeUndefined();
    expect(next.sections.find((s) => s.id === "exp")).toBeDefined();
  });

  test("withSectionRemoved is a no-op for unknown id", () => {
    const next = withSectionRemoved(baseResume, "does-not-exist");
    expect(next.sections).toEqual(baseResume.sections);
  });
});

describe("withItemsReordered", () => {
  // The base fixture has only 1 item per section, build a richer one here.
  const richResume: Resume = {
    schemaVersion: 1,
    header: { name: "X", items: [] },
    sections: [
      {
        id: "exp",
        type: "timeline",
        title: "Experience",
        hidden: false,
        items: [
          {
            id: "a",
            title: "A",
            subtitle: "",
            dateRange: { start: "2020-01", end: null },
            description: [],
          },
          {
            id: "b",
            title: "B",
            subtitle: "",
            dateRange: { start: "2021-01", end: null },
            description: [],
          },
          {
            id: "c",
            title: "C",
            subtitle: "",
            dateRange: { start: "2022-01", end: null },
            description: [],
          },
        ],
      },
    ],
  };

  test("moves an item forward inside its parent section", () => {
    const next = withItemsReordered(richResume, "exp", 0, 2);
    const section = next.sections[0];
    if (!section || section.type !== "timeline") throw new Error();
    expect(section.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  test("moves an item backward inside its parent section", () => {
    const next = withItemsReordered(richResume, "exp", 2, 0);
    const section = next.sections[0];
    if (!section || section.type !== "timeline") throw new Error();
    expect(section.items.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  test("no-op when from === to", () => {
    const next = withItemsReordered(richResume, "exp", 1, 1);
    expect(next).toBe(richResume);
  });

  test("no-op for out-of-range indices", () => {
    expect(withItemsReordered(richResume, "exp", -1, 0)).toBe(richResume);
    expect(withItemsReordered(richResume, "exp", 0, 5)).toBe(richResume);
  });

  test("no-op for unknown section", () => {
    const next = withItemsReordered(richResume, "missing", 0, 1);
    expect(next.sections).toEqual(richResume.sections);
  });
});

describe("withSectionHiddenToggled", () => {
  test("flips hidden from false to true on the matching section only", () => {
    const next = withSectionHiddenToggled(baseResume, "exp");
    expect(next.sections[0]?.hidden).toBe(true);
    expect(next.sections[1]?.hidden).toBe(false);
  });

  test("flipping twice returns to the original value", () => {
    const once = withSectionHiddenToggled(baseResume, "exp");
    const twice = withSectionHiddenToggled(once, "exp");
    expect(twice.sections[0]?.hidden).toBe(false);
  });
});

describe("withSectionsReordered", () => {
  test("moves a section from one index to another", () => {
    // base order: exp, edu, proj, skills
    const next = withSectionsReordered(baseResume, 0, 2);
    expect(next.sections.map((s) => s.id)).toEqual([
      "edu",
      "proj",
      "exp",
      "skills",
    ]);
  });

  test("moving forward and backward both work", () => {
    const next = withSectionsReordered(baseResume, 3, 0);
    expect(next.sections.map((s) => s.id)).toEqual([
      "skills",
      "exp",
      "edu",
      "proj",
    ]);
  });

  test("no-op when from === to", () => {
    const next = withSectionsReordered(baseResume, 1, 1);
    expect(next).toBe(baseResume);
  });

  test("no-op for out-of-range indices", () => {
    expect(withSectionsReordered(baseResume, -1, 0)).toBe(baseResume);
    expect(withSectionsReordered(baseResume, 0, 99)).toBe(baseResume);
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
