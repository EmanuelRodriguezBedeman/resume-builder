import type {
  CategorizedTagsSection,
  CompactGridSection,
  DescriptionBlock,
  Resume,
  Section,
  ShowcaseSection,
  TimelineSection,
} from "../../types.ts";
import { useStore } from "../../store.ts";
import { theme } from "../../theme.ts";
import {
  withCategorizedTagsItem,
  withCompactGridItem,
  withDescriptionBlock,
  withDescriptionBlockAdded,
  withDescriptionBlockRemoved,
  withSectionTitle,
  withShowcaseItem,
  withShowcaseLink,
  withShowcaseLinkAdded,
  withShowcaseLinkRemoved,
  withTagAdded,
  withTagRemoved,
  withTimelineItem,
} from "../../updaters.ts";
import {
  DateRangeEditor,
  DescriptionBlockEditor,
  FlexibleDateEditor,
  LinkListEditor,
  TagListEditor,
  TextField,
} from "./shared.tsx";

// Field-level routing per ADR-0004 / src/locale/classification.ts.
// Per call site:
//   - Translatable fields (subtitle, category, ShowcaseItem.title,
//     ShowcaseLink.label, section.title, description text/leadIn) use
//     setResumeActiveLocale.
//   - Shared fields (TimelineItem.title, CompactGridItem.title,
//     techStack, dates, link icon/href) use setResumeBothLocales.
//   - Structural ops (adding/removing description blocks or showcase
//     links) use setResumeBothLocales to keep IDs aligned.

// -- Dispatch -----------------------------------------------------------

export function ItemForm({
  resume,
  sectionId,
  itemId,
}: {
  resume: Resume;
  sectionId: string;
  itemId: string;
}) {
  const section = resume.sections.find((s) => s.id === sectionId);
  if (!section) return <Empty message="Section not found." />;
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return <Empty message="Item not found." />;

  switch (section.type) {
    case "timeline":
      return (
        <TimelineItemForm section={section} itemId={itemId} />
      );
    case "compactGrid":
      return (
        <CompactGridItemForm section={section} itemId={itemId} />
      );
    case "showcase":
      return <ShowcaseItemForm section={section} itemId={itemId} />;
    case "categorizedTags":
      return (
        <CategorizedTagsItemForm section={section} itemId={itemId} />
      );
  }
}

function makeBlock(type: DescriptionBlock["type"]): DescriptionBlock {
  return type === "bullet"
    ? { type: "bullet", text: "" }
    : { type: "paragraph", text: "" };
}

function Empty({ message }: { message: string }) {
  return (
    <p style={{ color: theme.color.panelTextMuted, fontSize: "0.9rem" }}>
      {message}
    </p>
  );
}

function FormHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "1rem", margin: "0", fontWeight: 700 }}>{title}</h2>
      {subtitle ? (
        <p
          style={{
            fontSize: "0.8rem",
            color: theme.color.panelTextMuted,
            margin: "0.2rem 0 0",
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

// -- Timeline -----------------------------------------------------------

function TimelineItemForm({
  section,
  itemId,
}: {
  section: TimelineSection;
  itemId: string;
}) {
  const setResumeActiveLocale = useStore((s) => s.setResumeActiveLocale);
  const setResumeBothLocales = useStore((s) => s.setResumeBothLocales);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  return (
    <div>
      <FormHeading title="Experience entry" subtitle={section.title} />
      {/* Title = organization name → Shared (proper noun). */}
      <TextField
        label="Title (organization)"
        value={item.title}
        onChange={(title) =>
          setResumeBothLocales((r) =>
            withTimelineItem(r, section.id, itemId, { title }),
          )
        }
      />
      {/* Subtitle = role/position → Translatable. */}
      <TextField
        label="Subtitle (role / position)"
        value={item.subtitle}
        onChange={(subtitle) =>
          setResumeActiveLocale((r) =>
            withTimelineItem(r, section.id, itemId, { subtitle }),
          )
        }
      />
      {/* Date range = ISO strings → Shared. */}
      <DateRangeEditor
        label="Date range"
        value={item.dateRange}
        onChange={(dateRange) =>
          setResumeBothLocales((r) =>
            withTimelineItem(r, section.id, itemId, { dateRange }),
          )
        }
      />
      <DescriptionBlockEditor
        blocks={item.description}
        // Block text + leadIn are both Translatable.
        onChange={(idx, patch) =>
          setResumeActiveLocale((r) =>
            withDescriptionBlock(r, section.id, itemId, idx, patch),
          )
        }
        // Adding/removing blocks is structural → Shared.
        onAdd={(type) =>
          setResumeBothLocales((r) =>
            withDescriptionBlockAdded(r, section.id, itemId, makeBlock(type)),
          )
        }
        onRemove={(idx) =>
          setResumeBothLocales((r) =>
            withDescriptionBlockRemoved(r, section.id, itemId, idx),
          )
        }
      />
    </div>
  );
}

// -- CompactGrid --------------------------------------------------------

function CompactGridItemForm({
  section,
  itemId,
}: {
  section: CompactGridSection;
  itemId: string;
}) {
  const setResumeActiveLocale = useStore((s) => s.setResumeActiveLocale);
  const setResumeBothLocales = useStore((s) => s.setResumeBothLocales);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  return (
    <div>
      <FormHeading
        title="Compact grid entry"
        subtitle={section.title}
      />
      {/* Title = institution name → Shared (proper noun). */}
      <TextField
        label="Title"
        value={item.title}
        onChange={(title) =>
          setResumeBothLocales((r) =>
            withCompactGridItem(r, section.id, itemId, { title }),
          )
        }
      />
      {/* Subtitle (e.g. degree) → Translatable. */}
      <TextField
        label="Subtitle (optional)"
        value={item.subtitle ?? ""}
        onChange={(subtitle) =>
          setResumeActiveLocale((r) =>
            withCompactGridItem(
              r,
              section.id,
              itemId,
              subtitle ? { subtitle } : { subtitle: undefined },
            ),
          )
        }
      />
      {/* Date strings → Shared. */}
      <FlexibleDateEditor
        label="Date (optional)"
        value={item.date}
        onChange={(date) =>
          setResumeBothLocales((r) =>
            withCompactGridItem(r, section.id, itemId, { date }),
          )
        }
      />
    </div>
  );
}

// -- Showcase -----------------------------------------------------------

function ShowcaseItemForm({
  section,
  itemId,
}: {
  section: ShowcaseSection;
  itemId: string;
}) {
  const setResumeActiveLocale = useStore((s) => s.setResumeActiveLocale);
  const setResumeBothLocales = useStore((s) => s.setResumeBothLocales);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  return (
    <div>
      <FormHeading title="Project entry" subtitle={section.title} />
      {/* ShowcaseItem.title is Translatable (project names get localized). */}
      <TextField
        label="Title"
        value={item.title}
        onChange={(title) =>
          setResumeActiveLocale((r) =>
            withShowcaseItem(r, section.id, itemId, { title }),
          )
        }
      />
      {/* techStack = list of tags → Shared. */}
      <TextField
        label="Tech stack (comma-separated)"
        value={item.techStack.join(", ")}
        onChange={(raw) =>
          setResumeBothLocales((r) =>
            withShowcaseItem(r, section.id, itemId, {
              techStack: raw
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0),
            }),
          )
        }
      />
      <DescriptionBlockEditor
        blocks={item.description}
        onChange={(idx, patch) =>
          setResumeActiveLocale((r) =>
            withDescriptionBlock(r, section.id, itemId, idx, patch),
          )
        }
        onAdd={(type) =>
          setResumeBothLocales((r) =>
            withDescriptionBlockAdded(r, section.id, itemId, makeBlock(type)),
          )
        }
        onRemove={(idx) =>
          setResumeBothLocales((r) =>
            withDescriptionBlockRemoved(r, section.id, itemId, idx),
          )
        }
      />
      <LinkListEditor
        links={item.links}
        // Patch may carry icon, href (Shared) or label (Translatable).
        // Route by key so only label takes the active-locale path.
        onUpdate={(linkId, patch) => {
          if ("label" in patch) {
            setResumeActiveLocale((r) =>
              withShowcaseLink(r, section.id, itemId, linkId, patch),
            );
          } else {
            setResumeBothLocales((r) =>
              withShowcaseLink(r, section.id, itemId, linkId, patch),
            );
          }
        }}
        onAdd={() =>
          setResumeBothLocales((r) =>
            withShowcaseLinkAdded(r, section.id, itemId, {
              id: `link-${Date.now()}`,
              icon: "link",
              label: "New link",
              href: "",
            }),
          )
        }
        onRemove={(linkId) =>
          setResumeBothLocales((r) =>
            withShowcaseLinkRemoved(r, section.id, itemId, linkId),
          )
        }
      />
    </div>
  );
}

// -- CategorizedTags ---------------------------------------------------

function CategorizedTagsItemForm({
  section,
  itemId,
}: {
  section: CategorizedTagsSection;
  itemId: string;
}) {
  const setResumeActiveLocale = useStore((s) => s.setResumeActiveLocale);
  const setResumeBothLocales = useStore((s) => s.setResumeBothLocales);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  return (
    <div>
      <FormHeading title="Tag category" subtitle={section.title} />
      {/* Category name → Translatable (e.g. "Primary" / "Primarias"). */}
      <TextField
        label="Category"
        value={item.category}
        onChange={(category) =>
          setResumeActiveLocale((r) =>
            withCategorizedTagsItem(r, section.id, itemId, { category }),
          )
        }
      />
      {/* Tags = proper-noun-ish skill names → Shared. */}
      <TagListEditor
        label="Tags"
        tags={item.tags}
        onAdd={(tag) =>
          setResumeBothLocales((r) => withTagAdded(r, section.id, itemId, tag))
        }
        onRemove={(idx) =>
          setResumeBothLocales((r) => withTagRemoved(r, section.id, itemId, idx))
        }
      />
    </div>
  );
}

// -- Generic section form (edit section title) ------------------------

export function SectionForm({
  section,
}: {
  section: Section;
}) {
  // section.title is Translatable.
  const setResumeActiveLocale = useStore((s) => s.setResumeActiveLocale);
  return (
    <div>
      <FormHeading title={`Section · ${section.type}`} />
      <TextField
        label="Title"
        value={section.title}
        onChange={(title) =>
          setResumeActiveLocale((r) => withSectionTitle(r, section.id, title))
        }
      />
    </div>
  );
}
