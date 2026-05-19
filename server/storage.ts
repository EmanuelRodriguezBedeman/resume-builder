import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { bootstrapSpanishFromEnglish } from "./bootstrap.ts";

export type Locale = "en" | "es";

export type Resume = {
  schemaVersion: number;
  header: {
    name: string;
    items: unknown[];
  };
  sections: unknown[];
};

export type LocalesBundle = { en: Resume; es: Resume };

const DEFAULT_RESUME: Resume = {
  schemaVersion: 1,
  header: { name: "", items: [] },
  sections: [],
};

function localeFile(dir: string, locale: Locale): string {
  return join(dir, locale === "en" ? "resume_en.json" : "resume_es.json");
}

async function readJsonOrNull(filePath: string): Promise<Resume | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Resume;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

async function writeJsonAtomic(filePath: string, resume: Resume): Promise<void> {
  const serialized = JSON.stringify(resume, null, 2);
  await mkdir(dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  await writeFile(tmpPath, serialized, "utf-8");
  await rename(tmpPath, filePath);
}

export async function readBothLocales(dir: string): Promise<LocalesBundle> {
  const en =
    (await readJsonOrNull(localeFile(dir, "en"))) ??
    structuredClone(DEFAULT_RESUME);
  let es = await readJsonOrNull(localeFile(dir, "es"));
  if (es === null) {
    es = await bootstrapSpanishFromEnglish(en);
    await writeJsonAtomic(localeFile(dir, "es"), es);
  }
  return { en, es };
}

export async function writeLocale(
  dir: string,
  locale: Locale,
  resume: Resume,
): Promise<void> {
  await writeJsonAtomic(localeFile(dir, locale), resume);
}
