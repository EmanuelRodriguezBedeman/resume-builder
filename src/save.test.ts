import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createDebouncedSaver, type SaverFn } from "./save.ts";
import type { Resume } from "./types.ts";

const sampleA: Resume = {
  schemaVersion: 1,
  header: { name: "A", items: [] },
  sections: [],
};
const sampleB: Resume = {
  schemaVersion: 1,
  header: { name: "B", items: [] },
  sections: [],
};
const sampleC: Resume = {
  schemaVersion: 1,
  header: { name: "C", items: [] },
  sections: [],
};

describe("createDebouncedSaver", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("does not call the saver before the delay elapses", async () => {
    const saver = vi.fn<SaverFn>().mockResolvedValue();
    const debounced = createDebouncedSaver(saver, 500);

    await debounced(sampleA);
    vi.advanceTimersByTime(499);

    expect(saver).not.toHaveBeenCalled();
  });

  test("calls the saver once after the delay with the latest Resume", async () => {
    const saver = vi.fn<SaverFn>().mockResolvedValue();
    const debounced = createDebouncedSaver(saver, 500);

    await debounced(sampleA);
    await debounced(sampleB);
    await debounced(sampleC);
    vi.advanceTimersByTime(500);

    expect(saver).toHaveBeenCalledTimes(1);
    expect(saver).toHaveBeenCalledWith(sampleC);
  });

  test("a second burst after the first save schedules another save", async () => {
    const saver = vi.fn<SaverFn>().mockResolvedValue();
    const debounced = createDebouncedSaver(saver, 500);

    await debounced(sampleA);
    vi.advanceTimersByTime(500);
    expect(saver).toHaveBeenCalledTimes(1);

    await debounced(sampleB);
    vi.advanceTimersByTime(500);
    expect(saver).toHaveBeenCalledTimes(2);
    expect(saver).toHaveBeenLastCalledWith(sampleB);
  });
});
