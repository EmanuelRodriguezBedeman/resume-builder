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

type ResumeState =
  | { status: "loading" }
  | { status: "loaded"; resume: Resume }
  | { status: "error"; error: string };

type Store = {
  state: ResumeState;
  selection: Selection;
  expandedSections: Set<string>;

  // Resume lifecycle
  setLoaded: (resume: Resume) => void;
  setError: (error: string) => void;

  // Mutations (each one auto-saves to the backend, debounced)
  updateHeaderName: (name: string) => void;

  // Selection actions
  selectNone: () => void;
  selectHeader: () => void;
  selectSection: (sectionId: string) => void;
  selectItem: (sectionId: string, itemId: string) => void;

  // Sidebar tree state
  toggleSectionExpanded: (sectionId: string) => void;
};

const DEBOUNCE_MS = 500;
const debouncedSave = createDebouncedSaver(postResume, DEBOUNCE_MS);

export const useStore = create<Store>((set) => ({
  state: { status: "loading" },
  selection: { kind: "none" },
  expandedSections: new Set<string>(),

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

  selectNone: () => set({ selection: { kind: "none" } }),
  selectHeader: () => set({ selection: { kind: "header" } }),
  selectSection: (sectionId) =>
    set({ selection: { kind: "section", sectionId } }),
  selectItem: (sectionId, itemId) =>
    set({ selection: { kind: "item", sectionId, itemId } }),

  toggleSectionExpanded: (sectionId) =>
    set((prev) => {
      const next = new Set(prev.expandedSections);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return { expandedSections: next };
    }),
}));
