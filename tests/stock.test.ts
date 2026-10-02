import { describe, it, expect } from "vitest";
import { sampleData } from "./fixtures/sample-data";
import { applyMutation } from "../lib/operations";
import { memberSchema, transactionSchema } from "../lib/validation";
import type { Sabha, InventoryItem } from "../lib/types";
const payload = (itemId: string, mandal: string, quantity = 2) => ({
  date: "2026-01-01",
  mandal,
  attendees: [],
  preparedBy: [],
  dishesServed: [],
  ingredientsUsed: [
    { inventoryItemId: itemId, quantityUsed: quantity, unit: "kg" },
  ],
  notes: "",
});
describe("stock accounting", () => {
  it("combines duplicate ingredients and records one negative transaction", () => {
    const db = sampleData();
    const item = db.inventory[0];
    const before = item.currentStock;
    const body = payload(item._id, db.mandals[0]._id);
    body.ingredientsUsed.push({ ...body.ingredientsUsed[0] });
    const s = applyMutation(db, "sabhas", "create", body) as Sabha;
    expect(item.currentStock).toBe(before - 4);
    expect(s.ingredientsUsed).toHaveLength(1);
    expect(db.transactions.at(-1)?.quantity).toBe(-4);
    expect(db.transactions.at(-1)?.relatedSabhaId).toBe(s._id);
  });
  it("returns old stock before applying edits and restores it on deletion", () => {
    const db = sampleData();
    const item = db.inventory[0];
    const before = item.currentStock;
    const body = payload(item._id, db.mandals[0]._id);
    const s = applyMutation(db, "sabhas", "create", body) as Sabha;
    applyMutation(
      db,
      "sabhas",
      "update",
      payload(item._id, s.mandal, 5),
      s._id,
    );
    expect(item.currentStock).toBe(before - 5);
    applyMutation(db, "sabhas", "delete", {}, s._id);
    expect(item.currentStock).toBe(before);
    expect(
      db.transactions
        .filter((t) => t.itemId === item._id)
        .reduce((sum, t) => sum + t.quantity, 0),
    ).toBe(before);
  });
  it("does not create inventory transactions for attendance-only edits", () => {
    const db = sampleData();
    const s = applyMutation(
      db,
      "sabhas",
      "create",
      payload(db.inventory[0]._id, db.mandals[0]._id),
    ) as Sabha;
    const count = db.transactions.length;
    applyMutation(
      db,
      "sabhas",
      "update",
      { ...s, attendees: [db.members[0]._id] },
      s._id,
    );
    expect(db.transactions.length).toBe(count);
  });
  it("rejects insufficient stock, mismatched units, and missing references", () => {
    const db = sampleData();
    const body = payload(db.inventory[0]._id, db.mandals[0]._id, 1000);
    expect(() =>
      applyMutation(structuredClone(db), "sabhas", "create", body),
    ).toThrow("Not enough");
    expect(() =>
      applyMutation(structuredClone(db), "sabhas", "create", {
        ...body,
        ingredientsUsed: [{ ...body.ingredientsUsed[0], unit: "liter" }],
      }),
    ).toThrow("units");
    expect(() =>
      applyMutation(structuredClone(db), "sabhas", "create", {
        ...body,
        attendees: ["abcdefabcdefabcdefabcdef"],
      }),
    ).toThrow("no longer exists");
  });
  it("records opening stock and blocks direct stock balance changes", () => {
    const db = sampleData();
    const i = applyMutation(db, "inventory", "create", {
      itemName: "Test rice",
      category: "Grains",
      unit: "kg",
      currentStock: 10,
      reorderThreshold: 2,
    }) as InventoryItem;
    expect(i.currentStock).toBe(10);
    expect(db.transactions.at(-1)?.quantity).toBe(10);
    expect(() =>
      applyMutation(
        db,
        "inventory",
        "update",
        { ...i, currentStock: 100 },
        i._id,
      ),
    ).toThrow("restock or stock adjustment");
  });
  it("restocks and permits signed adjustments without a negative balance", () => {
    const db = sampleData();
    const item = db.inventory[0];
    const original = item.currentStock;
    const t = {
      itemId: item._id,
      type: "restock",
      quantity: 5,
      date: "2026-01-01",
      notes: "",
    };
    applyMutation(db, "transactions", "create", t);
    expect(item.currentStock).toBe(original + 5);
    applyMutation(db, "transactions", "create", {
      ...t,
      type: "adjustment",
      quantity: -1,
    });
    expect(item.currentStock).toBe(original + 4);
    expect(() =>
      applyMutation(db, "transactions", "create", {
        ...t,
        type: "adjustment",
        quantity: -1000,
      }),
    ).toThrow("Not enough");
  });
  it("protects referenced members and permanent stock history", () => {
    const db = sampleData();
    expect(() =>
      applyMutation(db, "members", "delete", {}, db.members[0]._id),
    ).toThrow("inactive");
    expect(() =>
      applyMutation(db, "transactions", "delete", {}, db.transactions[0]._id),
    ).toThrow("permanent");
    expect(() =>
      applyMutation(db, "inventory", "delete", {}, db.inventory[0]._id),
    ).toThrow("history");
  });
  it("allows planning a future menu but prevents early consumption and attendance", () => {
    const db = sampleData();
    const p = {
      ...payload(db.inventory[0]._id, db.mandals[0]._id),
      date: "2099-01-01",
    };
    expect(() => applyMutation(db, "sabhas", "create", p)).toThrow(
      "Future sabhas",
    );
    expect(() =>
      applyMutation(db, "sabhas", "create", { ...p, ingredientsUsed: [] }),
    ).not.toThrow();
  });
  it("rejects invalid member enums, names and stock transaction quantities", () => {
    const m = sampleData().members[0];
    expect(memberSchema.safeParse({ ...m, fullName: " " }).success).toBe(false);
    expect(memberSchema.safeParse({ ...m, jobStatus: "Invalid" }).success).toBe(
      false,
    );
    const t = {
      itemId: m._id,
      type: "restock",
      quantity: -2,
      date: "2026-01-01",
    };
    expect(transactionSchema.safeParse(t).success).toBe(false);
    expect(transactionSchema.safeParse({ ...t, quantity: 0 }).success).toBe(
      false,
    );
  });
});
