import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AccountUser } from "../lib/types";
const mocks = vi.hoisted(() => ({
  token: undefined as string | undefined,
  findById: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => (mocks.token ? { value: mocks.token } : undefined),
  }),
}));
vi.mock("../lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("../models/account", () => ({ Account: { findById: mocks.findById } }));
import { createSession, getSession, requireUser } from "../lib/auth";
import { canView, canReadCollection } from "../lib/access";
import {
  hashPassword,
  verifyPassword,
  normalizeUsername,
} from "../lib/password";
const user: AccountUser = {
  id: "abcdefabcdefabcdefabcdef",
  fullName: "Test Member",
  username: "test.member",
  role: "Viewer",
  permissions: { members: false, sabhas: false },
  isActive: true,
  sessionVersion: 1,
};
let stored: Record<string, unknown>;
beforeEach(() => {
  mocks.token = undefined;
  vi.stubEnv(
    "SESSION_SECRET",
    "test-session-secret-at-least-thirty-two-characters",
  );
  stored = { ...user, _id: user.id };
  mocks.findById.mockImplementation(() => ({ lean: async () => stored }));
});
afterEach(() => vi.unstubAllEnvs());
describe("named sessions and authorization", () => {
  it("rejects missing and forged cookies", async () => {
    expect(await getSession()).toBeNull();
    mocks.token = "forged.token";
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });
  it("does not grant development admin access", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(await getSession()).toBeNull();
  });
  it("accepts a named account but blocks member writes", async () => {
    mocks.token = await createSession(user);
    expect((await requireUser()).fullName).toBe("Test Member");
    await expect(requireUser(true)).rejects.toMatchObject({ status: 403 });
  });
  it("reads the current database role instead of trusting a token role", async () => {
    mocks.token = await createSession({ ...user, role: "Admin" });
    await expect(requireUser(true)).rejects.toMatchObject({ status: 403 });
  });
  it("allows the main admin", async () => {
    stored.role = "Admin";
    mocks.token = await createSession(user);
    expect((await requireUser(true)).role).toBe("Admin");
  });
  it("revokes disabled and password-reset accounts", async () => {
    mocks.token = await createSession(user);
    stored.isActive = false;
    expect(await getSession()).toBeNull();
    stored.isActive = true;
    stored.sessionVersion = 2;
    expect(await getSession()).toBeNull();
  });
  it("loads visibility changes for existing sessions", async () => {
    mocks.token = await createSession(user);
    expect(canView((await getSession())!, "members")).toBe(false);
    stored.permissions = { members: true, sabhas: false };
    expect(canView((await getSession())!, "members")).toBe(true);
  });
  it("does not serialize password hashes", async () => {
    stored.passwordHash = "private-hash";
    mocks.token = await createSession(user);
    expect(await getSession()).not.toHaveProperty("passwordHash");
  });
});
describe("section access", () => {
  it("defaults to inventory only", () => {
    expect(canReadCollection(user, "inventory")).toBe(true);
    for (const key of [
      "members",
      "mandals",
      "sabhas",
      "dishes",
      "transactions",
    ] as const)
      expect(canReadCollection(user, key)).toBe(false);
    for (const key of ["dashboard", "access", "members", "sabhas"] as const)
      expect(canView(user, key)).toBe(false);
  });
  it("grants sections independently while keeping stock notes private", () => {
    const granted = { ...user, permissions: { members: true, sabhas: false } };
    expect(canReadCollection(granted, "members")).toBe(true);
    expect(canReadCollection(granted, "sabhas")).toBe(false);
    expect(canReadCollection(granted, "transactions")).toBe(false);
  });
});
describe("password hashing", () => {
  it("accepts the requested eight-character member password and salts each account", async () => {
    const one = await hashPassword("Dasnadas");
    const two = await hashPassword("Dasnadas");
    expect(one).not.toBe(two);
    expect(one).not.toContain("Dasnadas");
    expect(await verifyPassword("Dasnadas", one)).toBe(true);
    expect(await verifyPassword("incorrect", one)).toBe(false);
  });
  it("normalizes names without requiring case or exact spacing", () =>
    expect(normalizeUsername("  VAISHVIK   Patel ")).toBe("vaishvik.patel"));
});
