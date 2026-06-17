import type { Resume } from "../../src/types.ts";

export type TargetLocale = "en" | "es";

// The AI returns this envelope (not a bare Resume) so the server learns which
// locale was used when the caller left it unspecified — see the locale rule
// in the prompt below.
export type AiEnvelope = { locale: TargetLocale; resume: Resume };

// Builds the single-shot prompt sent to the AI provider. The provider knows
// nothing about the Resume schema (ADR-0005): it receives this string and
// returns raw text. All schema knowledge lives here and in generate.ts.
//
// `resumeEn` is always the English locale — the source of structure and
// Shared-field values. `locale` is the desired output language; when omitted
// the AI detects it from the JD and reports it back in the envelope.
export function buildPrompt(
  resumeEn: Resume,
  jd: string,
  locale?: TargetLocale,
): string {
  const localeRule =
    locale === undefined
      ? `Detect the primary language of the job description. If it is Spanish, set "locale" to "es" and write all Translatable fields in Spanish; otherwise set "locale" to "en" and write them in English.`
      : `Set "locale" to "${locale}" and write all Translatable fields in ${
          locale === "es" ? "Spanish" : "English"
        }.`;

  return `You are tailoring a CV to a specific job description (JD).

You receive the candidate's full Resume as JSON and the JD as text. Produce a
tailored Resume that maximizes relevance to the JD.

# Rules

1. RELEVANCE: Identify the sections and items most relevant to the JD. Remove
   items that are clearly irrelevant to the role. You may reorder sections so
   the most relevant ones come first, but do not invent new sections or items.

2. REWRITE: Rewrite item descriptions (the Translatable fields: section.title,
   description block text/leadIn, item subtitles, showcase titles, link labels,
   tag categories) to surface skills and keywords from the JD. Stay truthful —
   rephrase and re-emphasize what is already there; never fabricate experience.

3. PRESERVE SHARED FIELDS EXACTLY: Do not change any "id", any "href", any
   "icon", "schemaVersion", "section.type", "section.hidden", date strings
   ("dateRange", "date"), the entire "header" (name and contact items), org
   names ("title" in timeline/compactGrid items), "techStack", and tag lists
   ("tags"). These are identical across locales and must be copied verbatim.

4. ${localeRule}

5. OUTPUT FORMAT: Respond with a SINGLE JSON object and NOTHING else — no prose,
   no explanation, no markdown code fences. The object MUST be exactly:
   { "locale": "en" | "es", "resume": <Resume> }
   where <Resume> matches the schema of the input Resume (same field shapes:
   schemaVersion:number, header:{name,items[]}, sections[] each with
   id/title/hidden/type and a type-appropriate items[]).

# Job description

${jd}

# Resume (English source)

${JSON.stringify(resumeEn)}`;
}
