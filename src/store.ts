import { create } from "zustand";
import { createDebouncedSaver, postResume } from "./save.ts";
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

type ResumeState =
  | { status: "loading" }
  | { status: "loaded"; resume: Resume }
  | { status: "error"; error: string };

type Store = {
  state: ResumeState;
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

  // Resume lifecycle
  setLoaded: (resume: Resume) => void;
  setError: (error: string) => void;

  // Mutations (each one auto-saves to the backend, debounced)
  updateHeaderName: (name: string) => void;
  // Generic producer-based mutation. Form widgets pass a pure updater from
  // src/updaters.ts and the store handles the save side effect.
  setResume: (producer: (current: Resume) => Resume) => void;

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
const debouncedSave = createDebouncedSaver(postResume, DEBOUNCE_MS);

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 500;
const FORM_PANEL_MIN_WIDTH = 280;
const FORM_PANEL_MAX_WIDTH = 650;

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export const useStore = create<Store>((set) => ({
  state: { status: "loading" },
  selection: { kind: "none" },
  expandedSections: new Set<string>(),
  panelCollapsed: true,
  sidebarCollapsed: false,
  sidebarWidth: 280,
  formPanelWidth: 380,
  hovered: { kind: "none" },

  setLoaded: (resume) =>
    set({
      state: { status: "loaded", resume },
      expandedSections: new Set(resume.sections.map((s) => s.id)),
    }),
  setError: (error) => set({ state: { status: "error", error } }),

  updateHeaderName: (name) =>
    set((prev) => {
      if (prev.state.status !== "loaded") return prev;
      const nextResume: Resume = {
        ...prev.state.resume,
        header: { ...prev.state.resume.header, name },
      };
      void debouncedSave(nextResume);
      return { state: { status: "loaded", resume: nextResume } };
    }),

  setResume: (producer) =>
    set((prev) => {
      if (prev.state.status !== "loaded") return prev;
      const nextResume = producer(prev.state.resume);
      void debouncedSave(nextResume);
      return { state: { status: "loaded", resume: nextResume } };
    }),

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
