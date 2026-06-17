import { memo } from "react";
import { useStore } from "../../store.ts";
import { sectionById, usePreviewSource } from "../previewSource.tsx";
import { CategorizedTagsSection } from "./CategorizedTagsSection.tsx";
import { CompactGridSection } from "./CompactGridSection.tsx";
import { ShowcaseSection } from "./ShowcaseSection.tsx";
import { TimelineSection } from "./TimelineSection.tsx";

// Self-subscribed dispatcher. Reads only the section's `type` + `hidden`
// flag (both primitives), so unrelated edits inside the section don't
// re-run this component.
export const SectionRenderer = memo(function SectionRenderer({
  sectionId,
}: {
  sectionId: string;
}) {
  const override = usePreviewSource();
  const storeDispatchKey = useStore((s) => {
    if (s.state.status !== "loaded") return null;
    const section = s.state.locales[s.activeLocale].sections.find(
      (sec) => sec.id === sectionId,
    );
    if (!section || section.hidden) return null;
    return section.type;
  });
  const dispatchKey = override
    ? (() => {
        const section = sectionById(override.resume, sectionId);
        return !section || section.hidden ? null : section.type;
      })()
    : storeDispatchKey;
  if (!dispatchKey) return null;
  switch (dispatchKey) {
    case "timeline":
      return <TimelineSection sectionId={sectionId} />;
    case "compactGrid":
      return <CompactGridSection sectionId={sectionId} />;
    case "showcase":
      return <ShowcaseSection sectionId={sectionId} />;
    case "categorizedTags":
      return <CategorizedTagsSection sectionId={sectionId} />;
  }
});
