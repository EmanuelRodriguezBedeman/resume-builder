import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  DeepLRequestError,
  MissingDeepLKeyError,
  translateText,
} from "./translate.ts";

function mockFetchOnce(response: Response | Promise<Response> | Error) {
  const fn = vi.fn(
    async (_url: string | URL | Request, _init?: RequestInit) => {
      if (response instanceof Error) throw response;
      return response;
    },
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("translateText", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("returns the translated text on a successful response", async () => {
    const fetchMock = mockFetchOnce(
      jsonResponse({
        translations: [{ detected_source_language: "EN", text: "Hola, mundo" }],
      }),
    );

    const out = await translateText("Hello, world", "es");
    expect(out).toBe("Hola, mundo");

    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("expected a fetch call");
    const [url, init] = call;
    expect(url).toBe("https://api-free.deepl.com/v2/translate");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["Authorization"]).toBe(
      "DeepL-Auth-Key test-key",
    );
    expect(JSON.parse(init?.body as string)).toEqual({
      text: ["Hello, world"],
      target_lang: "ES",
      source_lang: "EN",
    });
  });

  test("uses EN-US as target_lang when translating to en", async () => {
    const fetchMock = mockFetchOnce(
      jsonResponse({ translations: [{ text: "Hello" }] }),
    );

    await translateText("Hola", "en");
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("expected a fetch call");
    const body = JSON.parse(call[1]!.body as string);
    expect(body.target_lang).toBe("EN-US");
    expect(body.source_lang).toBe("ES");
  });

  test("throws MissingDeepLKeyError when DEEPL_API_KEY is unset", async () => {
    vi.stubEnv("DEEPL_API_KEY", "");
    const fetchMock = mockFetchOnce(jsonResponse({}));

    await expect(translateText("anything", "es")).rejects.toBeInstanceOf(
      MissingDeepLKeyError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("throws DeepLRequestError when DeepL responds with non-2xx", async () => {
    mockFetchOnce(
      new Response("quota exceeded", {
        status: 456,
        headers: { "content-type": "text/plain" },
      }),
    );

    const err = await translateText("Hello", "es").catch((e) => e);
    expect(err).toBeInstanceOf(DeepLRequestError);
    expect((err as DeepLRequestError).status).toBe(456);
  });

  test("throws DeepLRequestError when fetch itself rejects", async () => {
    mockFetchOnce(new TypeError("network down"));

    await expect(translateText("Hello", "es")).rejects.toBeInstanceOf(
      DeepLRequestError,
    );
  });

  test("throws DeepLRequestError when response is missing translations[0].text", async () => {
    mockFetchOnce(jsonResponse({ translations: [] }));

    await expect(translateText("Hello", "es")).rejects.toBeInstanceOf(
      DeepLRequestError,
    );
  });
});
