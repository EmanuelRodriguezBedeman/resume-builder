import type { Resume } from "./types.ts";

export type SaverFn = (resume: Resume) => Promise<void>;

/**
 * Wraps a save function so that rapid calls collapse into a single backend
 * write after `delayMs` of inactivity. The most recent Resume wins.
 */
export function createDebouncedSaver(
  saveFn: SaverFn,
  delayMs: number,
): SaverFn {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Resume | null = null;

  return async (resume: Resume): Promise<void> => {
    pending = resume;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const toSave = pending;
      pending = null;
      if (toSave !== null) {
        void saveFn(toSave);
      }
    }, delayMs);
  };
}

/** POST the Resume to the backend. */
export async function postResume(resume: Resume): Promise<void> {
  const res = await fetch("/resume", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resume }),
  });
  if (!res.ok) {
    throw new Error(`POST /resume failed: ${res.status}`);
  }
}
