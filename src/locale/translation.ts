// Per-field translation glue: stable path encoding, source-text hashing,
// and the blur-time commit pipeline that calls the backend's /translate
// endpoint and updates the peer locale + hash map.
//
// Why this lives in `src/locale/`: it pairs with `classification.ts`. The
// classification registry says which fields are Translatable; this file is
// the runtime for those edits.

import type { Locale } from "../save.ts";
import { useStore } from "../store.ts";

// -- Path encoding ------------------------------------------------------
//
// Each Translatable field needs a stable key, identical across runs, so
// the hash map persists meaningfully between sessions. We derive paths
// from existing IDs — section.id, item.id, link.id — which the ADR
// guarantees are Shared (identical across locales). Description blocks
// have no ID in the model, so they're array-indexed; reordering blocks
// (not yet supported in the UI) would shift their paths.

export type TranslationPath = string;

export const tpath = {
  sectionTitle: (sectionId: string): TranslationPath =>
    `section:${sectionId}:title`,
  timelineItemSubtitle: (
    sectionId: string,
    itemId: string,
  ): TranslationPath => `section:${sectionId}:item:${itemId}:subtitle`,
  compactGridItemSubtitle: (
    sectionId: string,
    itemId: string,
  ): TranslationPath => `section:${sectionId}:item:${itemId}:subtitle`,
  showcaseItemTitle: (
    sectionId: string,
    itemId: string,
  ): TranslationPath => `section:${sectionId}:item:${itemId}:title`,
  showcaseLinkLabel: (
    sectionId: string,
    itemId: string,
    linkId: string,
  ): TranslationPath =>
    `section:${sectionId}:item:${itemId}:link:${linkId}:label`,
  categorizedTagsItemCategory: (
    sectionId: string,
    itemId: string,
  ): TranslationPath => `section:${sectionId}:item:${itemId}:category`,
  descriptionBlockText: (
    sectionId: string,
    itemId: string,
    blockIdx: number,
  ): TranslationPath =>
    `section:${sectionId}:item:${itemId}:block:${blockIdx}:text`,
  descriptionBlockLeadIn: (
    sectionId: string,
    itemId: string,
    blockIdx: number,
  ): TranslationPath =>
    `section:${sectionId}:item:${itemId}:block:${blockIdx}:leadIn`,
};

// -- Hashing ------------------------------------------------------------
//
// djb2 with xor, 32-bit unsigned, hex-stringified. Stable across runs
// because it's a pure function of the input bytes. We only need it to
// detect "did this string change since last sync", not for security, so
// collisions on different inputs would cause silent staleness misses —
// vanishingly unlikely for prose-length values, fine for our use.

export function hashText(s: string): string {
  let h = 5381 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

// -- Stale detection ----------------------------------------------------
//
// Model: `translationHashes[path][L]` stores the hash of L's *peer*
// value at the last sync moment for L. In words: "L is up-to-date
// relative to a peer that hashed to this." When the peer's current
// value no longer hashes to that, L is stale.
//
// On a successful EN→ES translation we set both slots:
//   .es = hash(newEn)     ← ES is synced to newEn
//   .en = hash(newEsTr)   ← EN is synced to newEsTranslation (symmetric;
//                            lets an ES-side edit later flag EN as stale)
//
// On failure of the same EN→ES attempt:
//   .en = hash(currentEs) ← EN acknowledges current ES baseline (EN itself
//                            is not stale, the user just authored it)
//   .es is left unchanged ← its old value was hash(oldEn); current EN is
//                            newEn → mismatch → ES is flagged stale ✓

export type FieldHash = { en?: string; es?: string };
export type TranslationHashes = Record<TranslationPath, FieldHash>;

export function isFieldStale(
  hashes: FieldHash | undefined,
  locale: Locale,
  peerValue: string,
): boolean {
  if (!hashes) return false;
  const recorded = hashes[locale];
  if (recorded === undefined) return false;
  return recorded !== hashText(peerValue);
}

// -- Translation commit -------------------------------------------------

export type TranslationCommit = {
  path: TranslationPath;
  /** The new value the user typed in the active locale (post-blur). */
  newActiveValue: string;
  /** The peer locale's current value at this path (used for baseline pinning on failure). */
  peerValueAtAttempt: string;
  /** Callback that writes the translated string into the peer locale. */
  applyTranslation: (translated: string) => void;
};

/**
 * Calls POST /translate, applies the result to the peer locale, and
 * updates `translationHashes` accordingly. Best-effort: on failure the
 * peer value is left untouched and only the source-hash slot updates so
 * the peer is correctly flagged stale.
 */
export async function commitTranslation(c: TranslationCommit): Promise<void> {
  const { path, newActiveValue, peerValueAtAttempt, applyTranslation } = c;
  const { activeLocale, setTranslationHashes, setTranslationPending, setTranslationErrorMsg } =
    useStore.getState();
  const peerLocale: Locale = activeLocale === "en" ? "es" : "en";

  if (newActiveValue.trim() === "") {
    // Empty source: nothing to translate. Drop both hash slots so the
    // field returns to "never been synced" state — avoids a stale flag
    // for legitimately-blank fields.
    setTranslationHashes(path, { en: undefined, es: undefined });
    return;
  }

  setTranslationPending(path, true);
  try {
    const res = await fetch("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: newActiveValue, targetLocale: peerLocale }),
    });
    if (!res.ok) throw new Error(`POST /translate ${res.status}`);
    const { translated } = (await res.json()) as { translated: string };

    applyTranslation(translated);
    setTranslationHashes(path, {
      [activeLocale]: hashText(translated),
      [peerLocale]: hashText(newActiveValue),
    });
  } catch (err) {
    console.warn("[locale] translation failed:", err);
    setTranslationHashes(path, {
      [activeLocale]: hashText(peerValueAtAttempt),
    });
    setTranslationErrorMsg("Translation failed — click ⚠ to retry");
  } finally {
    setTranslationPending(path, false);
  }
}
