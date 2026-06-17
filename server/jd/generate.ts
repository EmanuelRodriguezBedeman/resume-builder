import type { Resume } from "../../src/types.ts";
import { getProvider, type Provider } from "./provider.ts";
import { buildPrompt, type AiEnvelope, type TargetLocale } from "./prompt.ts";

// No AI provider configured (AI_PROVIDER_API_KEY unset/unknown) → 503.
export class ProviderUnconfiguredError extends Error {
  constructor() {
    super("No AI provider configured");
    this.name = "ProviderUnconfiguredError";
  }
}

// The provider's HTTP API failed (network error, non-2xx, empty body) → 502.
export class AiRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

// The AI replied, but its output wasn't valid JSON or didn't match the Resume
// schema → 422.
export class InvalidAiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAiResponseError";
  }
}

export type GenerateResult = { resume: Resume; locale: TargetLocale };

const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Tailors `resumeEn` to `jd` via the configured AI provider and returns the
 * generated Resume plus the locale it was written in. Pure of filesystem
 * concerns — the caller persists the result. Throws one of the three typed
 * errors above so the route can map each to its HTTP status.
 */
export async function generateTailoredResume(
  resumeEn: Resume,
  jd: string,
  locale?: TargetLocale,
): Promise<GenerateResult> {
  const provider = getProvider();
  if (!provider) throw new ProviderUnconfiguredError();

  const prompt = buildPrompt(resumeEn, jd, locale);
  const raw = await callProvider(provider, prompt);
  const envelope = parseEnvelope(raw);

  // A caller-supplied locale wins over the AI's report; otherwise trust the
  // AI's detection.
  return { resume: envelope.resume, locale: locale ?? envelope.locale };
}

// Provider dispatch. Adding Claude later is one more branch here plus a
// callClaude() implementation (ADR-0005) — nothing else changes.
async function callProvider(provider: Provider, prompt: string): Promise<string> {
  switch (provider.type) {
    case "gemini":
      return callGemini(provider.apiKey, prompt);
  }
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    // responseMimeType forces raw JSON output (no markdown fences), which is
    // exactly the envelope the prompt asks for. Low temperature keeps the
    // structure-preserving rewrite faithful.
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (err) {
    throw new AiRequestError(`Gemini fetch failed: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new AiRequestError(`Gemini responded ${res.status}: ${errBody}`, res.status);
  }

  let json: GeminiResponse;
  try {
    json = (await res.json()) as GeminiResponse;
  } catch (err) {
    throw new AiRequestError(`Gemini returned invalid JSON: ${(err as Error).message}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new AiRequestError("Gemini response missing candidate text");
  }
  return text;
}

function parseEnvelope(raw: string): AiEnvelope {
  // responseMimeType: "application/json" should keep this clean, but strip a
  // stray markdown fence defensively in case a provider wraps the output.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new InvalidAiResponseError("AI response was not valid JSON");
  }

  if (!isRecord(parsed)) {
    throw new InvalidAiResponseError("AI response was not a JSON object");
  }
  if (parsed["locale"] !== "en" && parsed["locale"] !== "es") {
    throw new InvalidAiResponseError("AI response had an invalid 'locale'");
  }
  if (!isValidResume(parsed["resume"])) {
    throw new InvalidAiResponseError("AI response 'resume' did not match the Resume schema");
  }
  return { locale: parsed["locale"], resume: parsed["resume"] };
}

// -- Structural Resume validation ----------------------------------------
// Strict enough to reject a wrong-shaped AI response (the 422 case) without
// being a full schema library. Mirrors src/types.ts.

const SECTION_TYPES = new Set([
  "timeline",
  "compactGrid",
  "showcase",
  "categorizedTags",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown): v is string {
  return typeof v === "string";
}

function isValidResume(v: unknown): v is Resume {
  if (!isRecord(v)) return false;
  if (typeof v["schemaVersion"] !== "number") return false;

  const header = v["header"];
  if (!isRecord(header)) return false;
  if (!isStr(header["name"])) return false;
  if (!Array.isArray(header["items"])) return false;
  if (!header["items"].every(isValidHeaderItem)) return false;

  const sections = v["sections"];
  if (!Array.isArray(sections)) return false;
  return sections.every(isValidSection);
}

function isValidHeaderItem(v: unknown): boolean {
  return isRecord(v) && isStr(v["id"]) && isStr(v["icon"]) && isStr(v["text"]);
}

function isValidSection(v: unknown): boolean {
  if (!isRecord(v)) return false;
  if (!isStr(v["id"]) || !isStr(v["title"])) return false;
  if (typeof v["hidden"] !== "boolean") return false;
  if (!isStr(v["type"]) || !SECTION_TYPES.has(v["type"])) return false;
  if (!Array.isArray(v["items"])) return false;
  // Every item must at least be an object carrying a string id; finer per-type
  // shape is left to the editor, which tolerates partial items.
  return v["items"].every((it) => isRecord(it) && isStr(it["id"]));
}
