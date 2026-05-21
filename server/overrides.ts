import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type OverridesMap = Record<string, boolean>;

function overridesFile(dir: string): string {
  return join(dir, "translation-overrides.json");
}

export async function readOverrides(dir: string): Promise<OverridesMap> {
  try {
    const raw = await readFile(overridesFile(dir), "utf-8");
    return JSON.parse(raw) as OverridesMap;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

export async function writeOverride(
  dir: string,
  path: string,
  locked: boolean,
): Promise<void> {
  const current = await readOverrides(dir);
  if (locked) {
    current[path] = true;
  } else {
    delete current[path];
  }
  const filePath = overridesFile(dir);
  const serialized = JSON.stringify(current, null, 2);
  await mkdir(dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  await writeFile(tmpPath, serialized, "utf-8");
  await rename(tmpPath, filePath);
}
