import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { configurationIssues } from "../lib/config";
import { NextRequest } from "next/server";
import { requireSameOrigin, readJson } from "../lib/request";
beforeEach(() => {
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/test");
  vi.stubEnv(
    "SESSION_SECRET",
    "a-random-secret-with-more-than-thirty-two-characters",
  );
  vi.stubEnv("ADMIN_PASSWORD", "a-long-unique-admin-password");
  vi.stubEnv("KARYAKARTA_PASSWORD", "");
  vi.stubEnv("VIEWER_PASSWORD", "");
  vi.stubEnv("APP_URL", "https://sabha.example.org");
});
afterEach(() => vi.unstubAllEnvs());
describe("production configuration", () => {
  it("accepts an explicitly configured deployment", () =>
    expect(configurationIssues(true)).toEqual([]));
  it("rejects missing MongoDB and insecure public origins", () => {
    vi.stubEnv("MONGODB_URI", "");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(configurationIssues(true)).toHaveLength(2);
  });
  it("rejects short session secrets", () => {
    vi.stubEnv("SESSION_SECRET", "short");
    expect(configurationIssues(true)).toHaveLength(1);
  });
  it("does not expose passwords in validation messages", () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret-value");
    expect(configurationIssues(true).join(" ")).not.toContain("secret-value");
  });
});
describe("request boundaries", () => {
  it("uses the canonical public origin behind a reverse proxy", () => {
    const r = new NextRequest("http://internal:3000/api/members", {
      method: "POST",
      headers: { origin: "https://sabha.example.org" },
    });
    expect(() => requireSameOrigin(r)).not.toThrow();
  });
  it("rejects foreign or absent origins", () => {
    for (const origin of ["https://attacker.invalid", ""])
      expect(() =>
        requireSameOrigin(
          new NextRequest("https://sabha.example.org/api/members", {
            method: "POST",
            headers: { origin },
          }),
        ),
      ).toThrow("different address");
  });
  it("rejects oversized JSON even without content-length", async () => {
    const r = new NextRequest("https://sabha.example.org/api/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "a".repeat(200) }),
    });
    await expect(readJson(r, 100)).rejects.toMatchObject({ status: 413 });
  });
  it("reports invalid JSON as a client error", async () => {
    const r = new NextRequest("https://sabha.example.org/api/members", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    await expect(readJson(r)).rejects.toMatchObject({ status: 400 });
  });
  it("accepts embedded-browser requests with a verified same-origin referrer", () => {
    const request = new NextRequest("https://sabha.example.org/api/auth", {
      method: "POST",
      headers: {
        referer: "https://sabha.example.org/login",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(() => requireSameOrigin(request)).not.toThrow();
  });
  it("rejects foreign, opaque, or cross-site referrer fallbacks", () => {
    const cases: Record<string, string>[] = [
      { referer: "https://attacker.invalid/login" },
      { origin: "null", referer: "https://sabha.example.org/login" },
      { referer: "https://sabha.example.org/login", "sec-fetch-site": "cross-site" },
    ];
    for (const headers of cases)
      expect(() =>
        requireSameOrigin(new NextRequest("https://sabha.example.org/api/auth", {
          method: "POST",
          headers,
        })),
      ).toThrow();
  });
});
