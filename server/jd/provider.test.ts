import { afterEach, describe, expect, test, vi } from "vitest";
import { getProvider } from "./provider.ts";

describe("getProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("returns null when AI_PROVIDER_API_KEY is absent", () => {
    vi.stubEnv("AI_PROVIDER_API_KEY", "");
    expect(getProvider()).toBeNull();
  });

  test("detects Gemini from an AIza... prefix", () => {
    vi.stubEnv("AI_PROVIDER_API_KEY", "AIzaSyExampleKey1234567890");
    expect(getProvider()).toEqual({
      type: "gemini",
      apiKey: "AIzaSyExampleKey1234567890",
    });
  });

  test("returns null for an unknown key format", () => {
    vi.stubEnv("AI_PROVIDER_API_KEY", "sk-openai-something");
    expect(getProvider()).toBeNull();
  });
});
