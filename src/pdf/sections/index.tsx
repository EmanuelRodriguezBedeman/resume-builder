import type { Section } from "../../types.ts";
import type { Locale } from "../../save.ts";
import { CategorizedTagsSection } from "./CategorizedTagsSection.tsx";
import { CompactGridSection } from "./CompactGridSection.tsx";
import { ShowcaseSection } from "./ShowcaseSection.tsx";
import { TimelineSection } from "./TimelineSection.tsx";

export function SectionRenderer({
  section,
  locale,
}: {
  section: Section;
  locale: Locale;
}) {
  if (section.hidden) return null;
  switch (section.type) {
    case "timeline":
      return <TimelineSection section={section} locale={locale} />;
    case "compactGrid":
      return <CompactGridSection section={section} locale={locale} />;
    case "showcase":
      return <ShowcaseSection section={section} />;
    case "categorizedTags":
      return <CategorizedTagsSection section={section} />;
  }
}
