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
import type { Locale } from "../../save.ts";
import { tpath, type TranslationPath } from "../../locale/translation.ts";
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
  subtleButtonStyle,
  type TranslationProps,
} from "./shared.tsx";
import { Languages } from "lucide-react";

// -- Peer-locale lookup helpers ----------------------------------------
//
// Translatable fields commit on blur by sending the new active value to
// /translate and writing the result into the *peer* locale. To do that
// each call site needs (a) the peer's current value at the same field
// (used as the failure-baseline hash) and (b) a way to write to the peer
// locale specifically. We subscribe to peer state via useStore.

function usePeerResume(): Resume | null {
  return useStore((s) =>
    s.state.status === "loaded"
      ? s.state.locales[s.activeLocale === "en" ? "es" : "en"]
      : null,
  );
}

function usePeerLocale(): Locale {
  return useStore((s) => (s.activeLocale === "en" ? "es" : "en"));
}

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

type LockEntry = {
  path: TranslationPath;
  activeValue: string;
  applyTranslation: (v: string) => void;
};

// "Lock all / Unlock all" shortcut for a form's non-description Translatable
// fields. Operates on all entries in one click — individual field locks still
// work independently via the per-field LockIcon.
function LockAllButton({ entries }: { entries: LockEntry[] }) {
  const activeLocale = useStore((s) => s.activeLocale);
  const translationOverrides = useStore((s) => s.translationOverrides);
  const setTranslationOverride = useStore((s) => s.setTranslationOverride);
  const setTranslationHashes = useStore((s) => s.setTranslationHashes);

  if (entries.length === 0) return null;

  const allLocked = entries.every((e) => translationOverrides[e.path]);
  const peerLocale: Locale = activeLocale === "en" ? "es" : "en";

  const handleClick = () => {
    if (!allLocked) {
      for (const { path, activeValue, applyTranslation } of entries) {
        applyTranslation(activeValue);
        setTranslationOverride(path, true);
        setTranslationHashes(path, { en: undefined, es: undefined });
      }
    } else {
      for (const { path } of entries) {
        setTranslationOverride(path, false);
        setTranslationHashes(path, { [peerLocale]: "__stale__" });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        allLocked
          ? "Unlock all — re-enable auto-translation for all fields"
          : "Lock all — copy active values to peer locale verbatim"
      }
      style={{
        ...subtleButtonStyle,
        marginBottom: "1rem",
        color: allLocked ? theme.color.panelTextMuted : "#22C55E",
      }}
    >
      <Languages size={12} strokeWidth={2.25} />
      {allLocked ? "Unlock all" : "Lock all"}
    </button>
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
  const setResumeForLocale = useStore((s) => s.setResumeForLocale);
  const peerResume = usePeerResume();
  const peerLocale = usePeerLocale();
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  const peerSection = peerResume?.sections.find((s) => s.id === section.id);
  const peerItem =
    peerSection?.type === "timeline"
      ? peerSection.items.find((i) => i.id === itemId)
      : undefined;

  const subtitleTranslation: TranslationProps = {
    path: tpath.timelineItemSubtitle(section.id, itemId),
    peerValue: peerItem?.subtitle ?? "",
    applyTranslation: (translated) =>
      setResumeForLocale(peerLocale, (r) =>
        withTimelineItem(r, section.id, itemId, { subtitle: translated }),
      ),
  };

  const blockTranslationFor = (
    idx: number,
    field: "text" | "leadIn",
  ): TranslationProps | undefined => {
    const peerBlock = peerItem?.description[idx];
    const peerValue =
      field === "text"
        ? peerBlock?.text ?? ""
        : peerBlock?.type === "bullet"
          ? peerBlock.leadIn ?? ""
          : "";
    const path =
      field === "text"
        ? tpath.descriptionBlockText(section.id, itemId, idx)
        : tpath.descriptionBlockLeadIn(section.id, itemId, idx);
    return {
      path,
      peerValue,
      applyTranslation: (translated) =>
        setResumeForLocale(peerLocale, (r) =>
          withDescriptionBlock(r, section.id, itemId, idx, {
            [field]: translated,
          } as Partial<DescriptionBlock>),
        ),
    };
  };

  return (
    <div>
      <FormHeading title="Experience entry" subtitle={section.title} />
      <LockAllButton
        entries={[
          {
            path: subtitleTranslation.path,
            activeValue: item.subtitle,
            applyTranslation: subtitleTranslation.applyTranslation,
          },
        ]}
      />
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
        translation={subtitleTranslation}
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
        blockTranslationFor={blockTranslationFor}
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
  const setResumeForLocale = useStore((s) => s.setResumeForLocale);
  const peerResume = usePeerResume();
  const peerLocale = usePeerLocale();
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  const peerSection = peerResume?.sections.find((s) => s.id === section.id);
  const peerItem =
    peerSection?.type === "compactGrid"
      ? peerSection.items.find((i) => i.id === itemId)
      : undefined;

  const subtitleTranslation: TranslationProps = {
    path: tpath.compactGridItemSubtitle(section.id, itemId),
    peerValue: peerItem?.subtitle ?? "",
    applyTranslation: (translated) =>
      setResumeForLocale(peerLocale, (r) =>
        withCompactGridItem(
          r,
          section.id,
          itemId,
          translated ? { subtitle: translated } : { subtitle: undefined },
        ),
      ),
  };

  return (
    <div>
      <FormHeading
        title="Compact grid entry"
        subtitle={section.title}
      />
      <LockAllButton
        entries={[
          {
            path: subtitleTranslation.path,
            activeValue: item.subtitle ?? "",
            applyTranslation: subtitleTranslation.applyTranslation,
          },
        ]}
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
        translation={subtitleTranslation}
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
  const setResumeForLocale = useStore((s) => s.setResumeForLocale);
  const peerResume = usePeerResume();
  const peerLocale = usePeerLocale();
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  const peerSection = peerResume?.sections.find((s) => s.id === section.id);
  const peerItem =
    peerSection?.type === "showcase"
      ? peerSection.items.find((i) => i.id === itemId)
      : undefined;

  const titleTranslation: TranslationProps = {
    path: tpath.showcaseItemTitle(section.id, itemId),
    peerValue: peerItem?.title ?? "",
    applyTranslation: (translated) =>
      setResumeForLocale(peerLocale, (r) =>
        withShowcaseItem(r, section.id, itemId, { title: translated }),
      ),
  };

  const blockTranslationFor = (
    idx: number,
    field: "text" | "leadIn",
  ): TranslationProps | undefined => {
    const peerBlock = peerItem?.description[idx];
    const peerValue =
      field === "text"
        ? peerBlock?.text ?? ""
        : peerBlock?.type === "bullet"
          ? peerBlock.leadIn ?? ""
          : "";
    const path =
      field === "text"
        ? tpath.descriptionBlockText(section.id, itemId, idx)
        : tpath.descriptionBlockLeadIn(section.id, itemId, idx);
    return {
      path,
      peerValue,
      applyTranslation: (translated) =>
        setResumeForLocale(peerLocale, (r) =>
          withDescriptionBlock(r, section.id, itemId, idx, {
            [field]: translated,
          } as Partial<DescriptionBlock>),
        ),
    };
  };

  const labelTranslationFor = (
    linkId: string,
  ): TranslationProps | undefined => {
    const peerLink = peerItem?.links.find((l) => l.id === linkId);
    return {
      path: tpath.showcaseLinkLabel(section.id, itemId, linkId),
      peerValue: peerLink?.label ?? "",
      applyTranslation: (translated) =>
        setResumeForLocale(peerLocale, (r) =>
          withShowcaseLink(r, section.id, itemId, linkId, {
            label: translated,
          }),
        ),
    };
  };

  const lockAllEntries: LockEntry[] = [
    {
      path: titleTranslation.path,
      activeValue: item.title,
      applyTranslation: titleTranslation.applyTranslation,
    },
    ...item.links.map((link) => {
      const t = labelTranslationFor(link.id);
      return {
        path: tpath.showcaseLinkLabel(section.id, itemId, link.id),
        activeValue: link.label,
        applyTranslation: t.applyTranslation,
      };
    }),
  ];

  return (
    <div>
      <FormHeading title="Project entry" subtitle={section.title} />
      <LockAllButton entries={lockAllEntries} />
      {/* ShowcaseItem.title is Translatable (project names get localized). */}
      <TextField
        label="Title"
        value={item.title}
        onChange={(title) =>
          setResumeActiveLocale((r) =>
            withShowcaseItem(r, section.id, itemId, { title }),
          )
        }
        translation={titleTranslation}
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
        blockTranslationFor={blockTranslationFor}
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
        labelTranslationFor={labelTranslationFor}
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
  const setResumeForLocale = useStore((s) => s.setResumeForLocale);
  const peerResume = usePeerResume();
  const peerLocale = usePeerLocale();
  const item = section.items.find((i) => i.id === itemId);
  if (!item) return null;

  const peerSection = peerResume?.sections.find((s) => s.id === section.id);
  const peerItem =
    peerSection?.type === "categorizedTags"
      ? peerSection.items.find((i) => i.id === itemId)
      : undefined;

  const categoryTranslation: TranslationProps = {
    path: tpath.categorizedTagsItemCategory(section.id, itemId),
    peerValue: peerItem?.category ?? "",
    applyTranslation: (translated) =>
      setResumeForLocale(peerLocale, (r) =>
        withCategorizedTagsItem(r, section.id, itemId, {
          category: translated,
        }),
      ),
  };

  return (
    <div>
      <FormHeading title="Tag category" subtitle={section.title} />
      <LockAllButton
        entries={[
          {
            path: categoryTranslation.path,
            activeValue: item.category,
            applyTranslation: categoryTranslation.applyTranslation,
          },
        ]}
      />
      {/* Category name → Translatable (e.g. "Primary" / "Primarias"). */}
      <TextField
        label="Category"
        value={item.category}
        onChange={(category) =>
          setResumeActiveLocale((r) =>
            withCategorizedTagsItem(r, section.id, itemId, { category }),
          )
        }
        translation={categoryTranslation}
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
  const setResumeForLocale = useStore((s) => s.setResumeForLocale);
  const peerResume = usePeerResume();
  const peerLocale = usePeerLocale();
  const peerSection = peerResume?.sections.find((s) => s.id === section.id);

  const titleTranslation: TranslationProps = {
    path: tpath.sectionTitle(section.id),
    peerValue: peerSection?.title ?? "",
    applyTranslation: (translated) =>
      setResumeForLocale(peerLocale, (r) =>
        withSectionTitle(r, section.id, translated),
      ),
  };

  return (
    <div>
      <FormHeading title={`Section · ${section.type}`} />
      <LockAllButton
        entries={[
          {
            path: titleTranslation.path,
            activeValue: section.title,
            applyTranslation: titleTranslation.applyTranslation,
          },
        ]}
      />
      <TextField
        label="Title"
        value={section.title}
        onChange={(title) =>
          setResumeActiveLocale((r) => withSectionTitle(r, section.id, title))
        }
        translation={titleTranslation}
      />
    </div>
  );
}
