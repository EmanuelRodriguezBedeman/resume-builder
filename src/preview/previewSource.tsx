import { createContext, useContext } from "react";
import type { Resume, Section } from "../types.ts";
import type { Locale } from "../save.ts";

// Read-only override for the preview tree. When set (the JD "Resume by JD"
// result view), HtmlPreview and its children render *this* resume instead of
// the Zustand store, in the given locale, with no hover/selection highlight.
//
// When null (the normal editor), every preview component falls back to its
// existing fine-grained `useStore` selector — so the editor's per-item
// subscription/perf characteristics are completely unchanged. This is how the
// generated CV stays isolated from the user's real Resume (issue #24).
export type PreviewSource = { resume: Resume; locale: Locale };

export const PreviewSourceContext = createContext<PreviewSource | null>(null);

export function usePreviewSource(): PreviewSource | null {
  return useContext(PreviewSourceContext);
}

export function sectionById(resume: Resume, id: string): Section | undefined {
  return resume.sections.find((s) => s.id === id);
}
