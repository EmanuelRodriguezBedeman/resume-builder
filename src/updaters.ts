// Pure functions that produce a new Resume given a current one.
// Each form widget in the editor wraps one of these and passes it to
// useStore.setResume(producer). Keeping them pure makes them trivially
// testable without spinning up the store.

import type {
  CategorizedTagsItem,
  CompactGridItem,
  DescriptionBlock,
  HeaderItem,
  Resume,
  Section,
  ShowcaseItem,
  ShowcaseLink,
  TimelineItem,
} from "./types.ts";

// -- Helpers -------------------------------------------------------------

function mapSection<T extends Section>(
  resume: Resume,
  sectionId: string,
  fn: (s: T) => T,
): Resume {
  return {
    ...resume,
    sections: resume.sections.map((s) =>
      s.id === sectionId ? (fn(s as T) as Section) : s,
    ),
  };
}

function mapItems<I extends { id: string }>(
  items: I[],
  itemId: string,
  fn: (i: I) => I,
): I[] {
  return items.map((i) => (i.id === itemId ? fn(i) : i));
}

// -- Header --------------------------------------------------------------

export function withHeaderName(resume: Resume, name: string): Resume {
  return { ...resume, header: { ...resume.header, name } };
}

export function withHeaderItem(
  resume: Resume,
  itemId: string,
  patch: Partial<Omit<HeaderItem, "id">>,
): Resume {
  return {
    ...resume,
    header: {
      ...resume.header,
      items: mapItems(resume.header.items, itemId, (i) => ({ ...i, ...patch })),
    },
  };
}

// -- Section ------------------------------------------------------------

export function withSectionTitle(
  resume: Resume,
  sectionId: string,
  title: string,
): Resume {
  return mapSection(resume, sectionId, (s) => ({ ...s, title }));
}

export type AddableSectionType =
  | "timeline"
  | "compactGrid"
  | "showcase"
  | "categorizedTags";

/** Create an empty Section of the requested type and append it to the Resume. */
export function withSectionAdded(
  resume: Resume,
  type: AddableSectionType,
  id: string,
): Resume {
  const base = { id, title: "New section", hidden: false };
  let section: Section;
  switch (type) {
    case "timeline":
      section = { ...base, type: "timeline", items: [] };
      break;
    case "compactGrid":
      section = { ...base, type: "compactGrid", items: [] };
      break;
    case "showcase":
      section = { ...base, type: "showcase", items: [] };
      break;
    case "categorizedTags":
      section = { ...base, type: "categorizedTags", items: [] };
      break;
  }
  return { ...resume, sections: [...resume.sections, section] };
}

export function withSectionRemoved(
  resume: Resume,
  sectionId: string,
): Resume {
  return {
    ...resume,
    sections: resume.sections.filter((s) => s.id !== sectionId),
  };
}

// -- Timeline item ------------------------------------------------------

export function withTimelineItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  patch: Partial<Omit<TimelineItem, "id">>,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "timeline"
      ? { ...s, items: mapItems(s.items, itemId, (i) => ({ ...i, ...patch })) }
      : s,
  );
}

// -- CompactGrid item ---------------------------------------------------

export function withCompactGridItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  patch: Partial<Omit<CompactGridItem, "id">>,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "compactGrid"
      ? { ...s, items: mapItems(s.items, itemId, (i) => ({ ...i, ...patch })) }
      : s,
  );
}

// -- Showcase item ------------------------------------------------------

export function withShowcaseItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  patch: Partial<Omit<ShowcaseItem, "id">>,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "showcase"
      ? { ...s, items: mapItems(s.items, itemId, (i) => ({ ...i, ...patch })) }
      : s,
  );
}

export function withShowcaseLinkAdded(
  resume: Resume,
  sectionId: string,
  itemId: string,
  link: ShowcaseLink,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "showcase"
      ? {
          ...s,
          items: mapItems(s.items, itemId, (i) => ({
            ...i,
            links: [...i.links, link],
          })),
        }
      : s,
  );
}

export function withShowcaseLinkRemoved(
  resume: Resume,
  sectionId: string,
  itemId: string,
  linkId: string,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "showcase"
      ? {
          ...s,
          items: mapItems(s.items, itemId, (i) => ({
            ...i,
            links: i.links.filter((l) => l.id !== linkId),
          })),
        }
      : s,
  );
}

export function withShowcaseLink(
  resume: Resume,
  sectionId: string,
  itemId: string,
  linkId: string,
  patch: Partial<Omit<ShowcaseLink, "id">>,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "showcase"
      ? {
          ...s,
          items: mapItems(s.items, itemId, (i) => ({
            ...i,
            links: i.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
          })),
        }
      : s,
  );
}

// -- CategorizedTags item -----------------------------------------------

export function withCategorizedTagsItem(
  resume: Resume,
  sectionId: string,
  itemId: string,
  patch: Partial<Omit<CategorizedTagsItem, "id">>,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "categorizedTags"
      ? { ...s, items: mapItems(s.items, itemId, (i) => ({ ...i, ...patch })) }
      : s,
  );
}

export function withTagAdded(
  resume: Resume,
  sectionId: string,
  itemId: string,
  tag: string,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "categorizedTags"
      ? {
          ...s,
          items: mapItems(s.items, itemId, (i) => ({
            ...i,
            tags: [...i.tags, tag],
          })),
        }
      : s,
  );
}

export function withTagRemoved(
  resume: Resume,
  sectionId: string,
  itemId: string,
  tagIdx: number,
): Resume {
  return mapSection(resume, sectionId, (s) =>
    s.type === "categorizedTags"
      ? {
          ...s,
          items: mapItems(s.items, itemId, (i) => ({
            ...i,
            tags: i.tags.filter((_, idx) => idx !== tagIdx),
          })),
        }
      : s,
  );
}

// -- Description blocks (Timeline + Showcase share the shape) ----------
// Branched per section type instead of via a shared type guard because
// TypeScript can't correlate the items array with the patch type when the
// type guard widens to a union.

function patchDescription(
  description: DescriptionBlock[],
  blockIdx: number,
  patch: Partial<DescriptionBlock>,
): DescriptionBlock[] {
  return description.map((b, idx) =>
    idx === blockIdx ? ({ ...b, ...patch } as DescriptionBlock) : b,
  );
}

export function withDescriptionBlock(
  resume: Resume,
  sectionId: string,
  itemId: string,
  blockIdx: number,
  patch: Partial<DescriptionBlock>,
): Resume {
  return mapSection(resume, sectionId, (s) => {
    if (s.type === "timeline") {
      return {
        ...s,
        items: mapItems(s.items, itemId, (i) => ({
          ...i,
          description: patchDescription(i.description, blockIdx, patch),
        })),
      };
    }
    if (s.type === "showcase") {
      return {
        ...s,
        items: mapItems(s.items, itemId, (i) => ({
          ...i,
          description: patchDescription(i.description, blockIdx, patch),
        })),
      };
    }
    return s;
  });
}
