import type { Locale } from "./storage.ts";

const DEEPL_FREE_API_URL = "https://api-free.deepl.com/v2/translate";

// DeepL's target_lang requires a region variant for English ("EN-US" or
// "EN-GB"); plain "EN" is deprecated for targets. source_lang doesn't take
// a region and uses the plain code.
const TARGET_LANG: Record<Locale, string> = {
  en: "EN-US",
  es: "ES",
};

const SOURCE_LANG: Record<Locale, string> = {
  en: "ES",
  es: "EN",
};

export class MissingDeepLKeyError extends Error {
  constructor() {
    super("DEEPL_API_KEY is not set");
    this.name = "MissingDeepLKeyError";
  }
}

export class DeepLRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "DeepLRequestError";
    this.status = status;
  }
}

type DeepLResponse = {
  translations?: Array<{ text?: string }>;
};

export async function translateText(
  text: string,
  targetLocale: Locale,
): Promise<string> {
  const apiKey = process.env["DEEPL_API_KEY"];
  if (!apiKey) {
    throw new MissingDeepLKeyError();
  }

  let res: Response;
  try {
    res = await fetch(DEEPL_FREE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        target_lang: TARGET_LANG[targetLocale],
        source_lang: SOURCE_LANG[targetLocale],
      }),
    });
  } catch (err) {
    throw new DeepLRequestError(
      `DeepL fetch failed: ${(err as Error).message}`,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new DeepLRequestError(
      `DeepL responded ${res.status}: ${body}`,
      res.status,
    );
  }

  let json: DeepLResponse;
  try {
    json = (await res.json()) as DeepLResponse;
  } catch (err) {
    throw new DeepLRequestError(
      `DeepL returned invalid JSON: ${(err as Error).message}`,
    );
  }

  const translated = json.translations?.[0]?.text;
  if (typeof translated !== "string") {
    throw new DeepLRequestError(
      "DeepL response missing translations[0].text",
    );
  }
  return translated;
}
