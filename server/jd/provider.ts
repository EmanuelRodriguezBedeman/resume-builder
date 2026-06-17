// AI provider abstraction for the Resume by JD feature. See
// docs/adr/0005-jd-ai-provider.md. A single AI_PROVIDER_API_KEY env var
// carries the credential; the provider is auto-detected from the key's
// prefix so there's no second var to keep in sync.

export type Provider = { type: "gemini"; apiKey: string };

// Adding a provider is a one-branch addition here (e.g. an "sk-ant-" prefix
// for Claude) — nothing else in the codebase changes.
export function getProvider(): Provider | null {
  const key = process.env["AI_PROVIDER_API_KEY"];
  if (!key) return null;
  if (key.startsWith("AIza")) return { type: "gemini", apiKey: key };
  return null; // unknown format → unconfigured
}
