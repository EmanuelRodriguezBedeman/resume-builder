import { beforeEach, describe, expect, test, vi } from "vitest";
import { useStore } from "./store.ts";
import type { Resume } from "./types.ts";
import { withHeaderName, withSectionTitle } from "./updaters.ts";

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

describe("setResumeActiveLocale", () => {
  test("writes to the active locale only — sibling locale untouched", () => {
    useStore
      .getState()
      .setResumeActiveLocale((r) => withSectionTitle(r, "exp", "Experiencia"));

    const state = useStore.getState().state;
    expect(state.status).toBe("loaded");
    if (state.status !== "loaded") return;
    expect(state.locales.en.sections[0]!.title).toBe("Experiencia");
    expect(state.locales.es.sections[0]!.title).toBe("Experience");
  });

  test("writes to ES when ES is the active locale", () => {
    useStore.getState().setActiveLocale("es");
    useStore
      .getState()
      .setResumeActiveLocale((r) => withSectionTitle(r, "exp", "Experiencia"));

    const state = useStore.getState().state;
    if (state.status !== "loaded") return;
    expect(state.locales.es.sections[0]!.title).toBe("Experiencia");
    expect(state.locales.en.sections[0]!.title).toBe("Experience");
  });

  test("is a no-op when the resume is not loaded", () => {
    useStore.setState({ state: { status: "loading" } });
    useStore.getState().setResumeActiveLocale((r) => r);
    expect(useStore.getState().state).toEqual({ status: "loading" });
  });
});

describe("setResumeBothLocales", () => {
  test("applies the producer to both locales", () => {
    useStore
      .getState()
      .setResumeBothLocales((r) => withHeaderName(r, "New Name"));

    const state = useStore.getState().state;
    if (state.status !== "loaded") return;
    expect(state.locales.en.header.name).toBe("New Name");
    expect(state.locales.es.header.name).toBe("New Name");
  });

  test("propagation is independent of the active locale", () => {
    useStore.getState().setActiveLocale("es");
    useStore
      .getState()
      .setResumeBothLocales((r) => withHeaderName(r, "Nombre Compartido"));

    const state = useStore.getState().state;
    if (state.status !== "loaded") return;
    expect(state.locales.en.header.name).toBe("Nombre Compartido");
    expect(state.locales.es.header.name).toBe("Nombre Compartido");
  });

  test("is a no-op when the resume is not loaded", () => {
    useStore.setState({ state: { status: "loading" } });
    useStore.getState().setResumeBothLocales((r) => r);
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
