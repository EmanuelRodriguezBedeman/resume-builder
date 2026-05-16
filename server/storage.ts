import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type Resume = {
  schemaVersion: number;
  header: {
    name: string;
    items: unknown[];
  };
  sections: unknown[];
};

const DEFAULT_RESUME: Resume = {
  schemaVersion: 1,
  header: { name: "", items: [] },
  sections: [],
};

export async function readResume(filePath: string): Promise<Resume> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Resume;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(DEFAULT_RESUME);
    }
    throw err;
  }
}

export async function writeResume(
  filePath: string,
  resume: Resume,
): Promise<void> {
  const serialized = JSON.stringify(resume, null, 2);
  await mkdir(dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  await writeFile(tmpPath, serialized, "utf-8");
  await rename(tmpPath, filePath);
}
