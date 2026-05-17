import type { Section } from "../../types.ts";
import { CategorizedTagsSection } from "./CategorizedTagsSection.tsx";
import { CompactGridSection } from "./CompactGridSection.tsx";
import { ShowcaseSection } from "./ShowcaseSection.tsx";
import { TimelineSection } from "./TimelineSection.tsx";

export function SectionRenderer({ section }: { section: Section }) {
  if (section.hidden) return null;
  switch (section.type) {
    case "timeline":
      return <TimelineSection section={section} />;
    case "compactGrid":
      return <CompactGridSection section={section} />;
    case "showcase":
      return <ShowcaseSection section={section} />;
    case "categorizedTags":
      return <CategorizedTagsSection section={section} />;
  }
}
