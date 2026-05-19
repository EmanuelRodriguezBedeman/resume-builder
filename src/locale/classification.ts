// Field classification registry per ADR-0004 (multi-locale Resume).
//
// Every editable surface in the app routes its mutation through one of two
// store actions:
//
//   setResumeActiveLocale(producer)  ← Translatable fields
//   setResumeBothLocales(producer)   ← Shared fields + structural ops
//
// This file is the single source of truth for which is which. It mirrors
// the "Translatable field" / "Shared field" entries in CONTEXT.md. Bugs in
// this classification cause silent data inconsistency (proper nouns getting
// translated, IDs drifting between locales) — that's why ADR-0004 calls it
// out as "load-bearing".
//
// The constants here are documentation. The compile-time wiring lives in
// the call sites that pick `setResumeActiveLocale` vs `setResumeBothLocales`
// based on which list a field belongs to.

/**
 * Translatable fields differ between locales. Edits go through
 * `setResumeActiveLocale` and are auto-translated to the peer locale on
 * blur (wired up in Slice 5).
 */
export const TRANSLATABLE_FIELDS = [
  "section.title",
  "TimelineItem.subtitle",
  "CompactGridItem.subtitle",
  "ShowcaseItem.title",
  "ShowcaseLink.label",
  "CategorizedTagsItem.category",
  "DescriptionBlock.text",
  "DescriptionBlock.leadIn",
] as const;

export type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number];

/**
 * Shared fields are identical across all locales. Edits go through
 * `setResumeBothLocales` and propagate immediately to every locale.
 *
 * Proper nouns (organization names, institution names) are Shared because
 * "Adia Health" should not become "Salud Adia" in the Spanish CV.
 */
export const SHARED_FIELDS = [
  "schemaVersion",
  // Header is entirely shared — name + contact items (text, href, icon).
  "header.name",
  "header.items[*].icon",
  "header.items[*].text",
  "header.items[*].href",
  // Section skeleton.
  "section.id",
  "section.type",
  "section.hidden",
  "section.items[*].id",
  // Per-section Shared item fields.
  "TimelineItem.title",
  "TimelineItem.dateRange",
  "CompactGridItem.title",
  "CompactGridItem.date",
  "ShowcaseItem.techStack",
  "ShowcaseLink.icon",
  "ShowcaseLink.href",
  "CategorizedTagsItem.tags",
] as const;

export type SharedField = (typeof SHARED_FIELDS)[number];

/**
 * Structural ops (add / remove / reorder / hide) always propagate to both
 * locales — otherwise IDs and ordering would drift, breaking the
 * shared-structure invariant.
 */
export const STRUCTURAL_OPS = [
  "addSection",
  "removeSection",
  "reorderSections",
  "toggleSectionHidden",
  "addItem",
  "removeItem",
  "reorderItems",
  "addHeaderItem",
  "removeHeaderItem",
  "addShowcaseLink",
  "removeShowcaseLink",
  "addDescriptionBlock",
  "removeDescriptionBlock",
] as const;

export type StructuralOp = (typeof STRUCTURAL_OPS)[number];
