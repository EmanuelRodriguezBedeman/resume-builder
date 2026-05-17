import { beforeEach, describe, expect, test, vi } from "vitest";
import { useStore } from "./store.ts";
import type { Resume } from "./types.ts";

const sample: Resume = {
  schemaVersion: 1,
  header: { name: "Original Name", items: [] },
  sections: [
    {
      id: "exp",
      type: "timeline",
      title: "Experience",
      hidden: false,
      items: [],
    },
  ],
};

beforeEach(() => {
  // fetch is invoked by the debounced auto-save; stub it so it doesn't escape.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }),
  );
  useStore.setState({
    state: { status: "loaded", resume: sample },
    selection: { kind: "none" },
    expandedSections: new Set(),
  });
});

describe("selection actions", () => {
  test("selectHeader sets the selection to header", () => {
    useStore.getState().selectHeader();
    expect(useStore.getState().selection).toEqual({ kind: "header" });
  });

  test("selectItem sets the selection with both ids", () => {
    useStore.getState().selectItem("exp", "i1");
    expect(useStore.getState().selection).toEqual({
      kind: "item",
      sectionId: "exp",
      itemId: "i1",
    });
  });
});

describe("updateHeaderName", () => {
  test("mutates the resume header name and leaves the rest untouched", () => {
    useStore.getState().updateHeaderName("New Name");

    const state = useStore.getState().state;
    expect(state.status).toBe("loaded");
    if (state.status !== "loaded") return;
    expect(state.resume.header.name).toBe("New Name");
    expect(state.resume.header.items).toEqual(sample.header.items);
    expect(state.resume.sections).toEqual(sample.sections);
  });

  test("is a no-op when the resume is not loaded", () => {
    useStore.setState({ state: { status: "loading" } });
    useStore.getState().updateHeaderName("Anything");
    expect(useStore.getState().state).toEqual({ status: "loading" });
  });
});

describe("toggleSectionExpanded", () => {
  test("adds an id when not present, removes when present", () => {
    useStore.getState().toggleSectionExpanded("exp");
    expect(useStore.getState().expandedSections.has("exp")).toBe(true);
    useStore.getState().toggleSectionExpanded("exp");
    expect(useStore.getState().expandedSections.has("exp")).toBe(false);
  });
});
