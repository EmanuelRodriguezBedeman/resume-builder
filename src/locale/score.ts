// Pure résumé-quality scorer. Given a single locale's `Resume` and which
// `Locale` it is, returns a 0–100 quality score. No side effects, no store,
// no fetch — every input arrives through the arguments.
//
// A `Resume` in the store is already locale-specific (the bundle holds one
// per locale). So `scoreResume(bundle.es, "es")` scores the Spanish CV; the
// "Translatable fields non-empty" criterion inspects that document directly.
// The `locale` argument is load-bearing for one criterion: action verbs are
// language-specific, so the verb set is keyed by locale.
//
// Display (toolbar badge) is out of scope here — see issue #27.

import type { Locale } from "../save.ts";
import type {
  DescriptionBlock,
  Resume,
  ShowcaseItem,
  TimelineItem,
} from "../types.ts";

// -- Weights ------------------------------------------------------------
//
// Named per the issue. They sum to exactly 100; each criterion is pass/fail
// and awards its full weight or nothing.

export const WEIGHTS = {
  /** Name + email + at least one further contact in the header. */
  header: 15,
  /** Timeline present, plus Showcase or CategorizedTags. */
  keySections: 15,
  /** Timeline/Showcase descriptions average ≥ MIN_AVG_WORDS words/item. */
  descriptionDensity: 15,
  /** ≥ MIN_ACTION_VERB_RATIO of description blocks open with an action verb. */
  actionVerbs: 15,
  /** ≥1 number or percentage appears in the descriptions. */
  quantifiedAchievements: 15,
  /** No section is hidden. */
  noHiddenSections: 10,
  /** Every applicable Translatable field is non-empty in this locale. */
  translatableComplete: 15,
} as const;

export const MAX_SCORE = 100;

/** Density threshold: mean words per Timeline/Showcase item. */
export const MIN_AVG_WORDS = 30;

/** Action-verb threshold: fraction of description blocks opening with a verb. */
export const MIN_ACTION_VERB_RATIO = 0.5;

// -- Action verbs -------------------------------------------------------
//
// English list is verbatim from the issue. Spanish counterparts (first-person
// preterite, the voice these CVs use) let an `es` résumé score on the same
// footing — that's why `scoreResume` needs the locale.

export const ACTION_VERBS: Record<Locale, ReadonlySet<string>> = {
  en: new Set([
    "led", "built", "developed", "improved", "reduced", "increased",
    "designed", "implemented", "launched", "shipped", "managed", "automated",
    "optimized", "delivered", "created", "scaled", "migrated", "refactored",
    "established", "drove",
  ]),
  es: new Set([
    "lideré", "construí", "desarrollé", "mejoré", "reduje", "aumenté",
    "diseñé", "implementé", "lancé", "entregué", "gestioné", "automaticé",
    "optimicé", "entregué", "creé", "escalé", "migré", "refactoricé",
    "establecí", "impulsé",
  ]),
};

// -- Small text helpers -------------------------------------------------

const isFilled = (s: string | undefined): boolean =>
  typeof s === "string" && s.trim() !== "";

const wordCount = (s: string): number =>
  s.trim() === "" ? 0 : s.trim().split(/\s+/).length;

/**
 * The text a block visually opens with: a bullet's bold lead-in if it has one,
 * otherwise its body text.
 */
const blockLeadText = (block: DescriptionBlock): string =>
  block.type === "bullet" && isFilled(block.leadIn)
    ? (block.leadIn as string)
    : block.text;

/** First whole word of a string, lowercased, with leading punctuation stripped. */
const firstWord = (s: string): string => {
  const m = s.trim().match(/^[^\p{L}]*(\p{L}+)/u);
  return m ? m[1].toLowerCase() : "";
};

// -- Resume traversal ---------------------------------------------------

/** All Timeline + Showcase items — the entries that carry descriptions. */
function describedItems(resume: Resume): Array<TimelineItem | ShowcaseItem> {
  const items: Array<TimelineItem | ShowcaseItem> = [];
  for (const section of resume.sections) {
    if (section.type === "timeline" || section.type === "showcase") {
      items.push(...section.items);
    }
  }
  return items;
}

const allDescriptionBlocks = (resume: Resume): DescriptionBlock[] =>
  describedItems(resume).flatMap((item) => item.description);

// -- Individual criteria ------------------------------------------------

function hasCompleteHeader(resume: Resume): boolean {
  const { name, items } = resume.header;
  if (!isFilled(name)) return false;
  const hasEmail = items.some((i) => i.icon === "mail" && isFilled(i.text));
  if (!hasEmail) return false;
  // At least one further contact beyond the email row.
  const otherContacts = items.filter(
    (i) => isFilled(i.text) && i.icon !== "mail",
  );
  return otherContacts.length >= 1;
}

function hasKeySections(resume: Resume): boolean {
  const types = new Set(resume.sections.map((s) => s.type));
  return (
    types.has("timeline") &&
    (types.has("showcase") || types.has("categorizedTags"))
  );
}

function hasDenseDescriptions(resume: Resume): boolean {
  const items = describedItems(resume);
  if (items.length === 0) return false;
  const totalWords = items.reduce(
    (sum, item) =>
      sum +
      item.description.reduce(
        (s, b) => s + wordCount(b.text) + (b.type === "bullet" ? wordCount(b.leadIn ?? "") : 0),
        0,
      ),
    0,
  );
  return totalWords / items.length >= MIN_AVG_WORDS;
}

function hasActionVerbs(resume: Resume, locale: Locale): boolean {
  const blocks = allDescriptionBlocks(resume);
  if (blocks.length === 0) return false;
  const verbs = ACTION_VERBS[locale];
  const starting = blocks.filter((b) =>
    verbs.has(firstWord(blockLeadText(b))),
  ).length;
  return starting / blocks.length >= MIN_ACTION_VERB_RATIO;
}

function hasQuantifiedAchievements(resume: Resume): boolean {
  return allDescriptionBlocks(resume).some(
    (b) => /\d|%/.test(b.text) || (b.type === "bullet" && /\d|%/.test(b.leadIn ?? "")),
  );
}

const hasNoHiddenSections = (resume: Resume): boolean =>
  resume.sections.every((s) => s.hidden !== true);

/**
 * Every Translatable field that is present in this locale's document is
 * non-empty. Optional Translatable fields (CompactGrid subtitle, bullet
 * lead-in) only count when defined. Mirrors TRANSLATABLE_FIELDS in
 * classification.ts.
 */
function translatableComplete(resume: Resume): boolean {
  const blockOk = (b: DescriptionBlock): boolean =>
    isFilled(b.text) &&
    (b.type !== "bullet" || b.leadIn === undefined || isFilled(b.leadIn));

  for (const section of resume.sections) {
    if (!isFilled(section.title)) return false;
    switch (section.type) {
      case "timeline":
        for (const item of section.items) {
          if (!isFilled(item.subtitle)) return false;
          if (!item.description.every(blockOk)) return false;
        }
        break;
      case "compactGrid":
        for (const item of section.items) {
          if (item.subtitle !== undefined && !isFilled(item.subtitle)) return false;
        }
        break;
      case "showcase":
        for (const item of section.items) {
          if (!isFilled(item.title)) return false;
          if (!item.links.every((l) => isFilled(l.label))) return false;
          if (!item.description.every(blockOk)) return false;
        }
        break;
      case "categorizedTags":
        for (const item of section.items) {
          if (!isFilled(item.category)) return false;
        }
        break;
    }
  }
  return true;
}

// -- Public API ---------------------------------------------------------

/**
 * Score a locale's résumé from 0 to 100. Pure: depends only on its arguments.
 */
export function scoreResume(resume: Resume, locale: Locale): number {
  let score = 0;
  if (hasCompleteHeader(resume)) score += WEIGHTS.header;
  if (hasKeySections(resume)) score += WEIGHTS.keySections;
  if (hasDenseDescriptions(resume)) score += WEIGHTS.descriptionDensity;
  if (hasActionVerbs(resume, locale)) score += WEIGHTS.actionVerbs;
  if (hasQuantifiedAchievements(resume)) score += WEIGHTS.quantifiedAchievements;
  if (hasNoHiddenSections(resume)) score += WEIGHTS.noHiddenSections;
  if (translatableComplete(resume)) score += WEIGHTS.translatableComplete;
  return score;
}
