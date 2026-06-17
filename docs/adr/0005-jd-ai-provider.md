# AI provider abstraction for Resume by JD

The Resume by JD feature needs to call an LLM to analyze a job description and produce a tailored Resume variant. The provider must be swappable without touching the generation logic, and the initial implementation must work at zero cost during development.

We're modeling this as **a single env var with auto-detected provider**: one `AI_PROVIDER_API_KEY` variable in `.env`; the server inspects the key's prefix to determine which provider to use. The prompt and generation logic live in `server/jd/prompt.ts` and `server/jd/generate.ts`, fully decoupled from provider details. The initial provider is **Google Gemini Flash** (free tier).

## Considered options

- **Explicit `AI_PROVIDER=gemini|claude|openai` alongside the key** — rejected. Two variables to keep in sync; forgetting to set one gives a confusing error. Auto-detection from key format is unambiguous and requires zero extra config.
- **Hardcode Gemini, no abstraction** — rejected. The abstraction cost is one extra file (`server/jd/provider.ts`); without it, switching providers requires touching the generation logic directly and risks entangling prompt strategy with HTTP client details.
- **Auto-detect from key prefix (this ADR)** — chosen. Key prefixes are stable and non-overlapping: `AIza…` → Gemini, `sk-ant-…` → Anthropic Claude. Adding a new provider is a one-branch addition in `provider.ts` with no other files changed.

## Provider interface

```ts
// server/jd/provider.ts
export type Provider = { type: "gemini"; apiKey: string };

export function getProvider(): Provider | null {
  const key = process.env.AI_PROVIDER_API_KEY;
  if (!key) return null;
  if (key.startsWith("AIza")) return { type: "gemini", apiKey: key };
  return null; // unknown format → unconfigured
}
```

Adding Claude later: add `if (key.startsWith("sk-ant-")) return { type: "claude", apiKey: key }` and a new `callClaude()` implementation. Nothing else changes.

## Prompt ownership

The prompt that instructs the AI (select relevant items, rewrite descriptions, detect JD language, output valid Resume JSON) lives in `server/jd/prompt.ts`. Provider modules receive a rendered prompt string and return a raw string response — they know nothing about the Resume schema.

## Consequences

- **One env var to document.** `.env.example` carries `AI_PROVIDER_API_KEY` with a comment explaining auto-detection and linking to Gemini Flash free tier signup.
- **Unconfigured is a valid state.** `getProvider()` returning `null` means the `/jd` route renders a setup nudge, not a 500. Users who don't need the JD feature don't need an API key at all.
- **Unknown key format → unconfigured.** If someone pastes an OpenAI key before OpenAI support is added, the feature gracefully shows the setup nudge rather than crashing.
- **Free tier is the target.** Gemini Flash free tier allows 15 RPM and 1M tokens/day — orders of magnitude more than a personal CV editor needs.
