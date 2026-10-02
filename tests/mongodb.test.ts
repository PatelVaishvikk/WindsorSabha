import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { LoginRateLimit, consumeLoginAttempt } from "../lib/login-rate-limit";
import { POST as login } from "../app/api/auth/route";
import { Account } from "../models/account";
import { hashPassword } from "../lib/password";
import { updateAccountAccess } from "../lib/account-access";
import { models } from "../models";
import { mutate, readDatabase } from "../lib/store";
import { connectDB } from "../lib/mongodb";
import type { InventoryItem, Mandal, Sabha } from "../lib/types";
let replica: MongoMemoryReplSet;
let item: InventoryItem;
let mandal: Mandal;
beforeAll(async () => {
  replica = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "7.0.14", downloadDir: "/private/tmp/sabha-mongodb" },
  });
  process.env.MONGODB_URI = replica.getUri("sabha_test");
  await connectDB();
  await LoginRateLimit.init();
  await Account.init();
  for (const model of Object.values(models)) await model.init();
});
afterAll(async () => {
  await mongoose.disconnect();
  await replica?.stop();
});
beforeEach(async () => {
  vi.stubEnv("TRUST_PROXY_IP", "false");
  await LoginRateLimit.deleteMany({});
  await Account.deleteMany({});
  for (const model of Object.values(models)) await model.deleteMany({});
  mandal = (await mutate("mandals", "create", {
    name: "Test mandal",
  })) as Mandal;
  item = (await mutate("inventory", "create", {
    itemName: "Rice",
    category: "Grains",
    unit: "kg",
    currentStock: 10,
    reorderThreshold: 2,
  })) as InventoryItem;
});
const sabha = (quantity: number) => ({
  date: "2026-01-01",
  mandal: mandal._id,
  attendees: [],
  preparedBy: [],
  dishesServed: [],
  ingredientsUsed: [
    { inventoryItemId: item._id, quantityUsed: quantity, unit: "kg" },
  ],
  notes: "",
});
describe("MongoDB replica-set transactions", () => {
  it("rolls back every write when a later ingredient is insufficient", async () => {
    const other = (await mutate("inventory", "create", {
      itemName: "Dal",
      category: "Pulses",
      unit: "kg",
      currentStock: 1,
      reorderThreshold: 2,
    })) as InventoryItem;
    const body = sabha(4);
    body.ingredientsUsed.push({
      inventoryItemId: other._id,
      quantityUsed: 5,
      unit: "kg",
    });
    await expect(mutate("sabhas", "create", body)).rejects.toThrow(
      "Not enough",
    );
    const db = await readDatabase();
    expect(db.sabhas).toHaveLength(0);
    expect(db.inventory.find((i) => i._id === item._id)?.currentStock).toBe(10);
    expect(db.transactions).toHaveLength(2);
  });
  it("prevents concurrent deductions from overselling the same stock", async () => {
    const results = await Promise.allSettled([
      mutate("sabhas", "create", sabha(7)),
      mutate("sabhas", "create", sabha(7)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const db = await readDatabase();
    expect(db.inventory[0].currentStock).toBe(3);
    expect(db.sabhas).toHaveLength(1);
    expect(
      db.transactions.filter((t) => t.type === "used-in-sabha"),
    ).toHaveLength(1);
  });
  it("commits edits, restoration, and the complete signed ledger", async () => {
    const saved = (await mutate("sabhas", "create", sabha(3))) as Sabha;
    await mutate("sabhas", "update", sabha(6), saved._id);
    expect((await readDatabase()).inventory[0].currentStock).toBe(4);
    await mutate("sabhas", "delete", {}, saved._id);
    const db = await readDatabase();
    expect(db.inventory[0].currentStock).toBe(10);
    expect(db.transactions.reduce((n, t) => n + t.quantity, 0)).toBe(10);
    expect(db.sabhas).toHaveLength(0);
  });
  it("starts empty and never silently inserts sample records", async () => {
    for (const model of Object.values(models)) await model.deleteMany({});
    const data = await readDatabase();
    for (const records of Object.values(data)) expect(records).toHaveLength(0);
  });
  it("enforces shared login limits with atomic concurrent increments", async () => {
    vi.stubEnv("TRUST_PROXY_IP", "true");
    const request = new NextRequest("http://localhost/api/auth", {
      headers: { "x-forwarded-for": "192.0.2.1" },
    });
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () => consumeLoginAttempt(request)),
    );
    expect(attempts.filter((attempt) => attempt.allowed)).toHaveLength(10);
    expect(await LoginRateLimit.countDocuments()).toBe(1);
  });
  it("ignores untrusted client IP headers", async () => {
    const requests = ["192.0.2.1", "192.0.2.2"].map(
      (ip) =>
        new NextRequest("http://localhost/api/auth", {
          headers: { "x-forwarded-for": ip },
        }),
    );
    for (const request of requests) await consumeLoginAttempt(request);
    expect(await LoginRateLimit.countDocuments()).toBe(1);
    expect((await LoginRateLimit.findOne())?.count).toBe(2);
  });
  it("issues secure production cookies and rejects invalid credentials", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://sabha.example.org");
    vi.stubEnv(
      "SESSION_SECRET",
      "a-production-test-secret-longer-than-thirty-two-characters",
    );
    vi.stubEnv("ADMIN_PASSWORD", "administrator-test-password");
    vi.stubEnv("KARYAKARTA_PASSWORD", "");
    vi.stubEnv("VIEWER_PASSWORD", "");
    await Account.create({
      fullName: "Test Admin",
      username: "test.admin",
      passwordHash: await hashPassword("administrator-test-password"),
      role: "Admin",
    });
    const request = (password: string) =>
      new NextRequest("https://sabha.example.org/api/auth", {
        method: "POST",
        headers: {
          origin: "https://sabha.example.org",
          "content-type": "application/json",
        },
        body: JSON.stringify({ username: "Test Admin", password }),
      });
    expect((await login(request("incorrect"))).status).toBe(401);
    const response = await login(request("administrator-test-password"));
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie.toLowerCase()).toContain("samesite=strict");
    expect(response.headers.get("cache-control")).toContain("no-store");
    vi.unstubAllEnvs();
  });
  it("protects the main admin from permission edits and role injection", async () => {
    const admin = await Account.create({
      fullName: "Admin",
      username: "admin",
      passwordHash: await hashPassword("test-password"),
      role: "Admin",
    });
    await expect(
      updateAccountAccess(String(admin._id), {
        permissions: { members: false, sabhas: false },
        isActive: false,
      }),
    ).rejects.toThrow("protected");
    await expect(
      updateAccountAccess(String(admin._id), {
        permissions: { members: false, sabhas: false },
        isActive: true,
        role: "Viewer",
      }),
    ).rejects.toThrow();
  });
  it("persists member visibility without changing identity or password", async () => {
    const hash = await hashPassword("test-password");
    const account = await Account.create({
      fullName: "Member",
      username: "member",
      passwordHash: hash,
      role: "Viewer",
    });
    const saved = await updateAccountAccess(String(account._id), {
      permissions: { members: true, sabhas: false },
      isActive: true,
    });
    expect(saved.permissions.members).toBe(true);
    expect(saved).not.toHaveProperty("passwordHash");
    expect(
      (await Account.findById(account._id).select("+passwordHash"))
        ?.passwordHash,
    ).toBe(hash);
  });
});
