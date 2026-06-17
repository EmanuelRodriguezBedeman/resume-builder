import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Resume } from "../../src/types.ts";
import {
  AiRequestError,
  generateTailoredResume,
  InvalidAiResponseError,
  ProviderUnconfiguredError,
} from "./generate.ts";

const SOURCE_RESUME: Resume = {
  schemaVersion: 1,
  header: {
    name: "Ada Lovelace",
    items: [{ id: "h1", icon: "mail", text: "ada@example.com" }],
  },
  sections: [
    {
      id: "exp",
      title: "Experience",
      hidden: false,
      type: "timeline",
      items: [
        {
          id: "exp1",
          title: "Analytical Engines Inc.",
          subtitle: "Lead Engineer",
          dateRange: { start: "1842-01", end: null },
          description: [{ type: "paragraph", text: "Built the first algorithm." }],
        },
      ],
    },
  ],
};

// A plausible tailored result: same structure/Shared fields, rewritten prose.
const TAILORED_RESUME: Resume = structuredClone(SOURCE_RESUME);
(TAILORED_RESUME.sections[0] as { items: { description: { text: string }[] }[] })
  .items[0].description[0].text = "Pioneered algorithmic computation pipelines.";

// Wraps an envelope string in the Gemini response shape.
function geminiResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text }] } }],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function mockFetch(response: Response | Error) {
  const fn = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("generateTailoredResume", () => {
  beforeEach(() => {
    vi.stubEnv("AI_PROVIDER_API_KEY", "AIzaTestKey123");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("happy path: returns the tailored resume and requested locale", async () => {
    const fetchMock = mockFetch(
      geminiResponse(
        JSON.stringify({ locale: "en", resume: TAILORED_RESUME }),
      ),
    );

    const result = await generateTailoredResume(
      SOURCE_RESUME,
      "We need a lead engineer with algorithm experience.",
      "en",
    );

    expect(result.locale).toBe("en");
    expect(result.resume).toEqual(TAILORED_RESUME);

    // Verify it actually called the Gemini endpoint with the key.
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(url).toContain("key=AIzaTestKey123");
  });

  test("uses the AI-detected locale when caller omits locale", async () => {
    mockFetch(
      geminiResponse(JSON.stringify({ locale: "es", resume: TAILORED_RESUME })),
    );

    const result = await generateTailoredResume(
      SOURCE_RESUME,
      "Buscamos un ingeniero líder con experiencia en algoritmos.",
    );

    expect(result.locale).toBe("es");
  });

  test("caller locale overrides the AI-reported locale", async () => {
    mockFetch(
      geminiResponse(JSON.stringify({ locale: "es", resume: TAILORED_RESUME })),
    );

    const result = await generateTailoredResume(SOURCE_RESUME, "JD text", "en");
    expect(result.locale).toBe("en");
  });

  test("throws InvalidAiResponseError when the AI returns non-JSON", async () => {
    mockFetch(geminiResponse("Sure! Here is your resume: <not json>"));

    await expect(
      generateTailoredResume(SOURCE_RESUME, "JD text", "en"),
    ).rejects.toBeInstanceOf(InvalidAiResponseError);
  });

  test("throws InvalidAiResponseError when JSON is valid but schema is wrong", async () => {
    mockFetch(
      geminiResponse(
        JSON.stringify({ locale: "en", resume: { schemaVersion: "oops" } }),
      ),
    );

    await expect(
      generateTailoredResume(SOURCE_RESUME, "JD text", "en"),
    ).rejects.toBeInstanceOf(InvalidAiResponseError);
  });

  test("throws AiRequestError when the provider API errors", async () => {
    mockFetch(
      new Response("rate limited", {
        status: 429,
        headers: { "content-type": "text/plain" },
      }),
    );

    await expect(
      generateTailoredResume(SOURCE_RESUME, "JD text", "en"),
    ).rejects.toBeInstanceOf(AiRequestError);
  });

  test("throws ProviderUnconfiguredError when no key is set", async () => {
    vi.stubEnv("AI_PROVIDER_API_KEY", "");
    const fetchMock = mockFetch(geminiResponse("{}"));

    await expect(
      generateTailoredResume(SOURCE_RESUME, "JD text", "en"),
    ).rejects.toBeInstanceOf(ProviderUnconfiguredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
