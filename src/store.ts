import { create } from "zustand";
import { createDebouncedSaver, postResume, type Locale } from "./save.ts";
import { scoreResume } from "./locale/score.ts";
import type {
  FieldHash,
  TranslationHashes,
  TranslationPath,
} from "./locale/translation.ts";
import type { Resume } from "./types.ts";

// What the sidebar currently has selected. Drives which form the center
// panel will render.
export type Selection =
  | { kind: "none" }
  | { kind: "header" }
  | { kind: "section"; sectionId: string }
  | { kind: "item"; sectionId: string; itemId: string };

// Cross-pane hover signal: which sidebar row is currently being hovered.
// Read by the preview to highlight the matching block. Same shape as
// Selection minus the "section row with a selected child" case — hover
// is purely the row directly under the cursor.
export type HoveredTarget =
  | { kind: "none" }
  | { kind: "header" }
  | { kind: "section"; sectionId: string }
  | { kind: "item"; sectionId: string; itemId: string };

export type LocalesBundle = { en: Resume; es: Resume };

// Per-locale résumé-quality scores (0–100), derived from the loaded bundle.
// scoreResume is pure and synchronous, so we recompute both on every resume
// mutation rather than memoizing or debouncing.
export type Scores = { en: number; es: number };

const computeScores = (locales: LocalesBundle): Scores => ({
  en: scoreResume(locales.en, "en"),
  es: scoreResume(locales.es, "es"),
});

type ResumeState =
  | { status: "loading" }
  | { status: "loaded"; locales: LocalesBundle }
  | { status: "error"; error: string };

type Store = {
  state: ResumeState;
  // Live per-locale quality scores, kept in sync with `state` by every
  // resume mutation. {en: 0, es: 0} until the first load completes.
  scores: Scores;
  activeLocale: Locale;
  selection: Selection;
  expandedSections: Set<string>;
  // The right form panel is collapsible. Starts collapsed; auto-expands
  // when the user picks something from the sidebar.
  panelCollapsed: boolean;
  // The left sidebar is also collapsible (manual toggle only).
  sidebarCollapsed: boolean;
  // User-adjustable widths (px) for both side panels.
  sidebarWidth: number;
  formPanelWidth: number;
  // Currently hovered sidebar row (drives preview highlight).
  hovered: HoveredTarget;
  // Per-field translation hashes — see src/locale/translation.ts for the
  // semantic model. Empty by default; populated by the blur-time commit
  // pipeline and read by the stale-marker UI.
  translationHashes: TranslationHashes;
  // Paths whose translation fetch is currently in-flight. Read by the
  // field UI to render a spinner instead of the stale marker.
  translationPending: Set<TranslationPath>;
  // Ephemeral error message shown as a toast when a translation fails.
  // Auto-cleared by the toast component after a few seconds.
  translationErrorMsg: string | null;
  // Per-field translation override map. When a path is present and true,
  // the field's active-locale value is copied verbatim to the peer locale
  // instead of being sent to DeepL. Loaded from GET /overrides on init.
  translationOverrides: Record<TranslationPath, boolean>;

  // Resume lifecycle
  setLoaded: (locales: LocalesBundle) => void;
  setError: (error: string) => void;
  setActiveLocale: (locale: Locale) => void;

  // Mutations (each one auto-saves to the backend, debounced).
  //
  // Two write paths per ADR-0004:
  //  - Translatable edits (subtitle, description, section.title, …) call
  //    setResumeActiveLocale: applies the producer to the active locale
  //    only and POSTs that locale's file.
  //  - Shared edits + structural ops (DnD, hide, add/remove, header fields,
  //    proper-noun titles, dates, tags) call setResumeBothLocales: applies
  //    the same producer to both locales and POSTs both files.
  //
  // The Shared vs Translatable taxonomy lives in src/locale/classification.ts.
  setResumeActiveLocale: (producer: (current: Resume) => Resume) => void;
  setResumeBothLocales: (producer: (current: Resume) => Resume) => void;
  // Write to a specific locale (used by the translation pipeline to apply
  // a DeepL result to the peer locale — neither active-only nor both
  // applies cleanly there).
  setResumeForLocale: (
    locale: Locale,
    producer: (current: Resume) => Resume,
  ) => void;

  // Merge a patch into translationHashes[path]. Keys whose value is
  // undefined remove the entry on read (isFieldStale treats undefined as
  // "no recorded hash").
  setTranslationHashes: (path: TranslationPath, patch: FieldHash) => void;
  setTranslationPending: (path: TranslationPath, pending: boolean) => void;
  setTranslationErrorMsg: (msg: string | null) => void;
  setTranslationOverrides: (overrides: Record<TranslationPath, boolean>) => void;
  setTranslationOverride: (path: TranslationPath, locked: boolean) => void;

  // Selection actions
  selectNone: () => void;
  selectHeader: () => void;
  selectSection: (sectionId: string) => void;
  selectItem: (sectionId: string, itemId: string) => void;

  // Panel collapse actions
  setPanelCollapsed: (collapsed: boolean) => void;
  togglePanelCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  // Resize actions (clamped inside the action).
  setSidebarWidth: (px: number) => void;
  setFormPanelWidth: (px: number) => void;

  // Hover actions (called by Sidebar onMouseEnter/Leave).
  setHovered: (target: HoveredTarget) => void;
  clearHovered: () => void;

  // Sidebar tree state
  toggleSectionExpanded: (sectionId: string) => void;
};

const DEBOUNCE_MS = 500;
// One debouncer per locale so that toggling active locale mid-edit doesn't
// drop the pending write to the other locale.
const debouncedSaveByLocale: Record<Locale, ReturnType<typeof createDebouncedSaver>> = {
  en: createDebouncedSaver((resume) => postResume("en", resume), DEBOUNCE_MS),
  es: createDebouncedSaver((resume) => postResume("es", resume), DEBOUNCE_MS),
};

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 500;
const FORM_PANEL_MIN_WIDTH = 280;
const FORM_PANEL_MAX_WIDTH = 650;

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/**
 * Read-only helper to grab the currently active locale's Resume from the
 * store. Returns null when state isn't `loaded`.
 */
export const selectActiveResume = (s: Store): Resume | null =>
  s.state.status === "loaded" ? s.state.locales[s.activeLocale] : null;

export const useStore = create<Store>((set) => ({
  state: { status: "loading" },
  scores: { en: 0, es: 0 },
  activeLocale: "en",
  selection: { kind: "none" },
  expandedSections: new Set<string>(),
  panelCollapsed: true,
  sidebarCollapsed: false,
  sidebarWidth: 280,
  formPanelWidth: 380,
  hovered: { kind: "none" },
  translationHashes: {},
  translationPending: new Set<TranslationPath>(),
  translationErrorMsg: null,
  translationOverrides: {} as Record<TranslationPath, boolean>,

  setLoaded: (locales) =>
    set((prev) => ({
      state: { status: "loaded", locales },
      scores: computeScores(locales),
      // Expansion is driven by section IDs in the active locale. IDs are
      // shared across locales (Slice 3 makes that invariant explicit), so
      // either side gives the same set.
      expandedSections: new Set(locales[prev.activeLocale].sections.map((s) => s.id)),
    })),
  setError: (error) => set({ state: { status: "error", error } }),

  setActiveLocale: (locale) => set({ activeLocale: locale }),

  setResumeActiveLocale: (producer) =>
    set((prev) => {
      if (prev.state.status !== "loaded") return prev;
      const locale = prev.activeLocale;
      const nextResume = producer(prev.state.locales[locale]);
      void debouncedSaveByLocale[locale](nextResume);
      const locales = { ...prev.state.locales, [locale]: nextResume };
      return {
        state: { status: "loaded", locales },
        scores: computeScores(locales),
      };
    }),

  setResumeBothLocales: (producer) =>
    set((prev) => {
      if (prev.state.status !== "loaded") return prev;
      // Same producer reference applied independently to each locale —
      // structural changes (IDs, ordering) come out identical because the
      // pre-state already shares them; shared-field edits land in both.
      const nextEn = producer(prev.state.locales.en);
      const nextEs = producer(prev.state.locales.es);
      void debouncedSaveByLocale.en(nextEn);
      void debouncedSaveByLocale.es(nextEs);
      const locales = { en: nextEn, es: nextEs };
      return {
        state: { status: "loaded", locales },
        scores: computeScores(locales),
      };
    }),

  setResumeForLocale: (locale, producer) =>
    set((prev) => {
      if (prev.state.status !== "loaded") return prev;
      const nextResume = producer(prev.state.locales[locale]);
      void debouncedSaveByLocale[locale](nextResume);
      const locales = { ...prev.state.locales, [locale]: nextResume };
      return {
        state: { status: "loaded", locales },
        scores: computeScores(locales),
      };
    }),

  setTranslationHashes: (path, patch) =>
    set((prev) => ({
      translationHashes: {
        ...prev.translationHashes,
        [path]: { ...prev.translationHashes[path], ...patch },
      },
    })),

  setTranslationPending: (path, pending) =>
    set((prev) => {
      const next = new Set(prev.translationPending);
      if (pending) next.add(path);
      else next.delete(path);
      return { translationPending: next };
    }),

  setTranslationErrorMsg: (msg) => set({ translationErrorMsg: msg }),

  setTranslationOverrides: (overrides) => set({ translationOverrides: overrides }),

  setTranslationOverride: (path, locked) => {
    set((prev) => {
      const next = { ...prev.translationOverrides };
      if (locked) {
        next[path] = true;
      } else {
        delete next[path];
      }
      return { translationOverrides: next };
    });
    void fetch("/overrides", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, locked }),
    });
  },

  selectNone: () => set({ selection: { kind: "none" } }),
  // Selecting anything in the sidebar auto-expands the form panel — this
  // is the only flow that opens it automatically. Manual collapse via the
  // chevron button does not clear the selection.
  selectHeader: () =>
    set({ selection: { kind: "header" }, panelCollapsed: false }),
  selectSection: (sectionId) =>
    set({
      selection: { kind: "section", sectionId },
      panelCollapsed: false,
    }),
  selectItem: (sectionId, itemId) =>
    set({
      selection: { kind: "item", sectionId, itemId },
      panelCollapsed: false,
    }),

  setPanelCollapsed: (collapsed) => set({ panelCollapsed: collapsed }),
  togglePanelCollapsed: () =>
    set((prev) => ({ panelCollapsed: !prev.panelCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () =>
    set((prev) => ({ sidebarCollapsed: !prev.sidebarCollapsed })),

  setSidebarWidth: (px) =>
    set({ sidebarWidth: clamp(px, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH) }),
  setFormPanelWidth: (px) =>
    set({
      formPanelWidth: clamp(px, FORM_PANEL_MIN_WIDTH, FORM_PANEL_MAX_WIDTH),
    }),

  setHovered: (target) => set({ hovered: target }),
  clearHovered: () => set({ hovered: { kind: "none" } }),

  toggleSectionExpanded: (sectionId) =>
    set((prev) => {
      const next = new Set(prev.expandedSections);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return { expandedSections: next };
    }),
}));
