import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import type { AccountUser } from "../lib/types";
const state = vi.hoisted(() => ({
  user: null as AccountUser | null,
  find: vi.fn(),
  mutate: vi.fn(),
}));
vi.mock("../lib/auth", () => ({
  getSession: async () => state.user,
  requireUser: async (admin = false) => {
    const { AppError } = await import("../lib/operations");
    if (!state.user) throw new AppError("Sign in", 401);
    if (admin && state.user.role !== "Admin")
      throw new AppError("Admin only", 403);
    return state.user;
  },
}));
vi.mock("../lib/config", () => ({ configurationIssues: () => [] }));
vi.mock("../lib/mongodb", () => ({ connectDB: vi.fn() }));
vi.mock("../lib/store", () => ({ mutate: state.mutate }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("Redirect:" + path);
  },
}));
vi.mock("../models", () => ({
  models: Object.fromEntries(
    ["members", "mandals", "sabhas", "dishes", "inventory", "transactions"].map(
      (key) => [
        key,
        {
          find: () => {
            state.find(key);
            return {
              lean: async () =>
                key === "inventory"
                  ? [{ _id: "abc", itemName: "Rice" }]
                  : [
                      {
                        _id: "secret",
                        fullName: "Private Member",
                        email: "private@example.org",
                      },
                    ],
              select: () => ({
                lean: async () => [
                  { _id: "secret", fullName: "Private Member" },
                ],
              }),
            };
          },
        },
      ],
    ),
  ),
}));
import { getData } from "../lib/data";
import { handle } from "../lib/api";
const member: AccountUser = {
  id: "abcdefabcdefabcdefabcdef",
  fullName: "Test Member",
  username: "test.member",
  role: "Viewer",
  permissions: { members: false, sabhas: false },
  isActive: true,
  sessionVersion: 1,
};
beforeEach(() => {
  state.user = structuredClone(member);
  vi.clearAllMocks();
});
describe("API and server-rendered data boundaries", () => {
  it("serializes only stock data for default members", async () => {
    const data = await getData("inventory");
    expect(data.members).toEqual([]);
    expect(data.sabhas).toEqual([]);
    expect(data.transactions).toEqual([]);
    expect(JSON.stringify(data)).not.toContain("private@example.org");
    expect(state.find).toHaveBeenCalledTimes(1);
    expect(state.find).toHaveBeenCalledWith("inventory");
  });
  it("redirects hidden pages and all member write forms", async () => {
    await expect(getData("members")).rejects.toThrow("Redirect:/inventory");
    await expect(getData("inventory", true)).rejects.toThrow(
      "Redirect:/inventory",
    );
    expect(state.find).not.toHaveBeenCalled();
  });
  it("rejects direct API reads for hidden sections", async () => {
    for (const collection of [
      "members",
      "sabhas",
      "transactions",
      "mandals",
      "dishes",
    ])
      expect(
        (
          await handle(
            new NextRequest("http://localhost/api/" + collection),
            collection,
          )
        ).status,
      ).toBe(403);
    expect(state.find).not.toHaveBeenCalled();
  });
  it("allows stock reads but rejects direct stock writes", async () => {
    expect(
      (
        await handle(
          new NextRequest("http://localhost/api/inventory"),
          "inventory",
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await handle(
          new NextRequest("http://localhost/api/inventory", { method: "POST" }),
          "inventory",
        )
      ).status,
    ).toBe(403);
    expect(state.mutate).not.toHaveBeenCalled();
  });
  it("grants independent read-only member access", async () => {
    state.user!.permissions.members = true;
    expect(
      (await handle(new NextRequest("http://localhost/api/members"), "members"))
        .status,
    ).toBe(200);
    expect(
      (
        await handle(
          new NextRequest("http://localhost/api/members", { method: "POST" }),
          "members",
        )
      ).status,
    ).toBe(403);
  });
  it("shares attendee names without private profiles when only sabhas are visible", async () => {
    state.user!.permissions.sabhas = true;
    const data = await getData("sabhas");
    expect(data.members[0].fullName).toBe("Private Member");
    expect(JSON.stringify(data.members)).not.toContain("private@example.org");
  });
  it("blocks anonymous access", async () => {
    state.user = null;
    expect(
      (
        await handle(
          new NextRequest("http://localhost/api/inventory"),
          "inventory",
        )
      ).status,
    ).toBe(401);
  });
});
