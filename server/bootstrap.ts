import type { Resume } from "./storage.ts";
import { translateText } from "./translate.ts";

// Translatable surface mirrors src/locale/classification.ts (Slice 3):
//   section.title, TimelineItem.subtitle, CompactGridItem.subtitle,
//   ShowcaseItem.title, ShowcaseLink.label, CategorizedTagsItem.category,
//   DescriptionBlock.text, DescriptionBlock.leadIn.
// Everything else is Shared and must not be translated (proper nouns like
// "Adia Health" must not become "Salud Adia").
//
// storage.ts intentionally keeps `sections: unknown[]`. We narrow per the
// `type` discriminator here just to walk the translatable surface.

type DescriptionBlock = {
  type: "paragraph" | "bullet";
  text?: string;
  leadIn?: string;
};

type TimelineItem = {
  subtitle?: string;
  description?: DescriptionBlock[];
};

type CompactGridItem = {
  subtitle?: string;
};

type ShowcaseLink = {
  label?: string;
};

type ShowcaseItem = {
  title?: string;
  description?: DescriptionBlock[];
  links?: ShowcaseLink[];
};

type CategorizedTagsItem = {
  category?: string;
};

type Section = {
  title?: string;
  type: "timeline" | "compactGrid" | "showcase" | "categorizedTags";
  items?: unknown[];
};

/**
 * Translates every Translatable field of `en` into Spanish and returns a
 * new Resume. Slow path — typically 30+ DeepL calls, 5–10s total. Only
 * intended for the once-per-machine bootstrap when `data/resume_es.json`
 * is missing (ADR-0004, "Auto-bootstrap").
 *
 * Falls back to a deep clone if `DEEPL_API_KEY` is unset, so dev still
 * works without a key. Per-field failures are tolerated: the EN text is
 * kept for that field, a warning is logged, and Slice 5's stale-tracking
 * UI flags it as a ⚠ for manual retry later.
 */
export async function bootstrapSpanishFromEnglish(en: Resume): Promise<Resume> {
  if (!process.env["DEEPL_API_KEY"]) {
    console.warn(
      "[bootstrap] DEEPL_API_KEY not set — falling back to EN→ES clone. " +
        "Set DEEPL_API_KEY to enable auto-translation of the Spanish locale.",
    );
    return structuredClone(en);
  }

  console.log(
    "[bootstrap] Spanish locale missing — translating EN→ES via DeepL " +
      "(this is a one-time cost, ~5–10s)...",
  );
  const start = Date.now();
  const es = structuredClone(en);

  let translated = 0;
  let skipped = 0;
  const tr = async (text: string): Promise<string> => {
    if (!text.trim()) return text;
    try {
      const out = await translateText(text, "es");
      translated += 1;
      if (translated % 5 === 0) {
        console.log(`[bootstrap]   ...${translated} fields translated`);
      }
      return out;
    } catch (err) {
      skipped += 1;
      console.warn(
        `[bootstrap]   skipping field (kept EN): ${(err as Error).message}`,
      );
      return text;
    }
  };

  const walkBlocks = async (
    blocks: DescriptionBlock[] | undefined,
  ): Promise<void> => {
    if (!Array.isArray(blocks)) return;
    for (const block of blocks) {
      if (typeof block.text === "string") {
        block.text = await tr(block.text);
      }
      if (typeof block.leadIn === "string") {
        block.leadIn = await tr(block.leadIn);
      }
    }
  };

  for (const section of (es.sections ?? []) as Section[]) {
    if (typeof section.title === "string") {
      section.title = await tr(section.title);
    }
    if (!Array.isArray(section.items)) continue;
    switch (section.type) {
      case "timeline":
        for (const item of section.items as TimelineItem[]) {
          if (typeof item.subtitle === "string") {
            item.subtitle = await tr(item.subtitle);
          }
          await walkBlocks(item.description);
        }
        break;
      case "compactGrid":
        for (const item of section.items as CompactGridItem[]) {
          if (typeof item.subtitle === "string") {
            item.subtitle = await tr(item.subtitle);
          }
        }
        break;
      case "showcase":
        for (const item of section.items as ShowcaseItem[]) {
          if (typeof item.title === "string") {
            item.title = await tr(item.title);
          }
          await walkBlocks(item.description);
          if (Array.isArray(item.links)) {
            for (const link of item.links) {
              if (typeof link.label === "string") {
                link.label = await tr(link.label);
              }
            }
          }
        }
        break;
      case "categorizedTags":
        for (const item of section.items as CategorizedTagsItem[]) {
          if (typeof item.category === "string") {
            item.category = await tr(item.category);
          }
        }
        break;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `[bootstrap] Done — ${translated} translated, ${skipped} skipped, ${elapsed}s elapsed.`,
  );
  return es;
}
