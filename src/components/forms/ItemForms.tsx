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
  const setResume = useStore((s) => s.setResume);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;
  const update = (patch: Parameters<typeof withTimelineItem>[3]) =>
    setResume((r) => withTimelineItem(r, section.id, itemId, patch));

  return (
    <div>
      <FormHeading title="Experience entry" subtitle={section.title} />
      <TextField
        label="Title (organization)"
        value={item.title}
        onChange={(title) => update({ title })}
      />
      <TextField
        label="Subtitle (role / position)"
        value={item.subtitle}
        onChange={(subtitle) => update({ subtitle })}
      />
      <DateRangeEditor
        label="Date range"
        value={item.dateRange}
        onChange={(dateRange) => update({ dateRange })}
      />
      <DescriptionBlockEditor
        blocks={item.description}
        onChange={(idx, patch) =>
          setResume((r) => withDescriptionBlock(r, section.id, itemId, idx, patch))
        }
        onAdd={(type) =>
          setResume((r) =>
            withDescriptionBlockAdded(r, section.id, itemId, makeBlock(type)),
          )
        }
        onRemove={(idx) =>
          setResume((r) =>
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
  const setResume = useStore((s) => s.setResume);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;
  const update = (patch: Parameters<typeof withCompactGridItem>[3]) =>
    setResume((r) => withCompactGridItem(r, section.id, itemId, patch));

  return (
    <div>
      <FormHeading
        title="Compact grid entry"
        subtitle={section.title}
      />
      <TextField
        label="Title"
        value={item.title}
        onChange={(title) => update({ title })}
      />
      <TextField
        label="Subtitle (optional)"
        value={item.subtitle ?? ""}
        onChange={(subtitle) =>
          update(subtitle ? { subtitle } : { subtitle: undefined })
        }
      />
      <FlexibleDateEditor
        label="Date (optional)"
        value={item.date}
        onChange={(date) => update({ date })}
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
  const setResume = useStore((s) => s.setResume);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;
  const update = (patch: Parameters<typeof withShowcaseItem>[3]) =>
    setResume((r) => withShowcaseItem(r, section.id, itemId, patch));

  return (
    <div>
      <FormHeading title="Project entry" subtitle={section.title} />
      <TextField
        label="Title"
        value={item.title}
        onChange={(title) => update({ title })}
      />
      <TextField
        label="Tech stack (comma-separated)"
        value={item.techStack.join(", ")}
        onChange={(raw) =>
          update({
            techStack: raw
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0),
          })
        }
      />
      <DescriptionBlockEditor
        blocks={item.description}
        onChange={(idx, patch) =>
          setResume((r) => withDescriptionBlock(r, section.id, itemId, idx, patch))
        }
        onAdd={(type) =>
          setResume((r) =>
            withDescriptionBlockAdded(r, section.id, itemId, makeBlock(type)),
          )
        }
        onRemove={(idx) =>
          setResume((r) =>
            withDescriptionBlockRemoved(r, section.id, itemId, idx),
          )
        }
      />
      <LinkListEditor
        links={item.links}
        onUpdate={(linkId, patch) =>
          setResume((r) =>
            withShowcaseLink(r, section.id, itemId, linkId, patch),
          )
        }
        onAdd={() =>
          setResume((r) =>
            withShowcaseLinkAdded(r, section.id, itemId, {
              id: `link-${Date.now()}`,
              icon: "link",
              label: "New link",
              href: "",
            }),
          )
        }
        onRemove={(linkId) =>
          setResume((r) => withShowcaseLinkRemoved(r, section.id, itemId, linkId))
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
  const setResume = useStore((s) => s.setResume);
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;
  const update = (patch: Parameters<typeof withCategorizedTagsItem>[3]) =>
    setResume((r) => withCategorizedTagsItem(r, section.id, itemId, patch));

  return (
    <div>
      <FormHeading title="Tag category" subtitle={section.title} />
      <TextField
        label="Category"
        value={item.category}
        onChange={(category) => update({ category })}
      />
      <TagListEditor
        label="Tags"
        tags={item.tags}
        onAdd={(tag) =>
          setResume((r) => withTagAdded(r, section.id, itemId, tag))
        }
        onRemove={(idx) =>
          setResume((r) => withTagRemoved(r, section.id, itemId, idx))
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
  const setResume = useStore((s) => s.setResume);
  return (
    <div>
      <FormHeading title={`Section · ${section.type}`} />
      <TextField
        label="Title"
        value={section.title}
        onChange={(title) =>
          setResume((r) => ({
            ...r,
            sections: r.sections.map((s) =>
              s.id === section.id ? { ...s, title } : s,
            ),
          }))
        }
      />
    </div>
  );
}
