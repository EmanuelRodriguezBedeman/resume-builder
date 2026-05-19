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
    state: {
      status: "loaded",
      locales: { en: sample, es: sample },
    },
    activeLocale: "en",
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

describe("setActiveLocale", () => {
  test("flips the activeLocale flag", () => {
    expect(useStore.getState().activeLocale).toBe("en");
    useStore.getState().setActiveLocale("es");
    expect(useStore.getState().activeLocale).toBe("es");
  });
});

describe("updateHeaderName", () => {
  test("mutates only the active locale's header name", () => {
    useStore.getState().updateHeaderName("New Name");

    const state = useStore.getState().state;
    expect(state.status).toBe("loaded");
    if (state.status !== "loaded") return;
    expect(state.locales.en.header.name).toBe("New Name");
    // Sibling locale untouched in Slice 2 (no propagation yet).
    expect(state.locales.es.header.name).toBe("Original Name");
    expect(state.locales.en.header.items).toEqual(sample.header.items);
    expect(state.locales.en.sections).toEqual(sample.sections);
  });

  test("writes to ES when ES is the active locale", () => {
    useStore.getState().setActiveLocale("es");
    useStore.getState().updateHeaderName("Nombre Nuevo");

    const state = useStore.getState().state;
    if (state.status !== "loaded") return;
    expect(state.locales.es.header.name).toBe("Nombre Nuevo");
    expect(state.locales.en.header.name).toBe("Original Name");
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
