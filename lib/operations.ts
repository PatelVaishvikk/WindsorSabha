import { randomBytes } from "node:crypto";
import { today } from "./format";
import { parseInput } from "./validation";
import type {
  Database,
  Collection,
  Member,
  InventoryItem,
  Sabha,
  StockTransaction,
  Dish,
  Mandal,
} from "./types";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const newId = () => randomBytes(12).toString("hex");
const rounded = (n: number) => Math.round(n * 1000000) / 1000000;
export function applyMutation(
  db: Database,
  collection: Collection,
  method: "create" | "update" | "delete",
  raw: unknown,
  id?: string,
) {
  const rows = db[collection] as { _id: string }[];
  const existing = id ? rows.find((r) => r._id === id) : undefined;
  if (method !== "create" && !existing)
    throw new AppError("Record not found", 404);
  if (collection === "transactions" && method !== "create")
    throw new AppError(
      "Stock history is permanent. Add an adjustment to correct a balance.",
    );
  const recordId = id || newId();
  const addTransaction = (
    itemId: string,
    quantity: number,
    type: StockTransaction["type"],
    notes: string,
    relatedSabhaId?: string,
    date = new Date().toISOString(),
  ) => {
    const item = db.inventory.find((i) => i._id === itemId);
    if (!item) throw new AppError("Inventory item not found");
    const next = rounded(item.currentStock + quantity);
    if (next < 0)
      throw new AppError(
        `Not enough ${item.itemName}. Available: ${item.currentStock} ${item.unit}.`,
      );
    item.currentStock = next;
    if (
      type === "restock" &&
      (!item.lastRestockedDate ||
        new Date(date) > new Date(item.lastRestockedDate))
    )
      item.lastRestockedDate = date;
    const entry = {
      _id: newId(),
      itemId,
      quantity: rounded(quantity),
      type,
      date,
      notes,
      relatedSabhaId,
    };
    db.transactions.push(entry);
    return entry;
  };
  const reverseSabha = (sabha: Sabha) => {
    for (const ingredient of sabha.ingredientsUsed)
      addTransaction(
        ingredient.inventoryItemId,
        ingredient.quantityUsed,
        "adjustment",
        `Stock returned: sabha ${method === "delete" ? "deleted" : "updated"}`,
        sabha._id,
      );
  };
  if (method === "delete") {
    if (collection === "sabhas") reverseSabha(existing as Sabha);
    if (
      collection === "members" &&
      db.sabhas.some(
        (s) =>
          s.attendees.includes(recordId) || s.preparedBy.includes(recordId),
      )
    )
      throw new AppError(
        "This member has sabha history. Mark them inactive to preserve attendance records.",
      );
    if (
      collection === "inventory" &&
      (db.transactions.some((t) => t.itemId === recordId) ||
        db.dishes.some((d) =>
          d.standardIngredients.some((i) => i.item === recordId),
        ) ||
        db.sabhas.some((s) =>
          s.ingredientsUsed.some((i) => i.inventoryItemId === recordId),
        ))
    )
      throw new AppError(
        "This item has stock history or dish references and cannot be deleted.",
      );
    if (
      collection === "mandals" &&
      (db.members.some((m) => m.mandal === recordId) ||
        db.sabhas.some((s) => s.mandal === recordId))
    )
      throw new AppError("This mandal is in use.");
    rows.splice(
      rows.findIndex((r) => r._id === recordId),
      1,
    );
    return { _id: recordId };
  }
  const value = { ...parseInput(collection, raw), _id: recordId };
  if (collection === "members" || collection === "sabhas") {
    if (!db.mandals.some((m) => m._id === (value as Member | Sabha).mandal))
      throw new AppError("Mandal not found");
  }
  if (
    collection === "mandals" &&
    db.mandals.some(
      (m) =>
        m._id !== recordId &&
        m.name.toLowerCase() === (value as Mandal).name.toLowerCase(),
    )
  )
    throw new AppError("A mandal with this name already exists.");
  if (collection === "inventory") {
    const item = value as InventoryItem;
    if (existing) {
      const old = existing as InventoryItem;
      if (item.currentStock !== old.currentStock)
        throw new AppError(
          "Use a restock or stock adjustment to change the balance.",
        );
      if (
        item.unit !== old.unit &&
        db.transactions.some((t) => t.itemId === recordId)
      )
        throw new AppError(
          "Units cannot change after stock is recorded. Create a separate inventory item.",
        );
      Object.assign(item, { lastRestockedDate: old.lastRestockedDate });
    } else {
      const opening = item.currentStock;
      item.currentStock = 0;
      db.inventory.push(item);
      if (opening > 0)
        addTransaction(recordId, opening, "restock", "Opening stock");
      return item;
    }
  }
  if (collection === "dishes") {
    for (const ingredient of (value as Dish).standardIngredients) {
      const item = db.inventory.find((i) => i._id === ingredient.item);
      if (!item || item.unit !== ingredient.unit)
        throw new AppError(
          "Dish ingredient must use the inventory item’s unit.",
        );
    }
  }
  if (collection === "sabhas") {
    const sabha = value as Sabha;
    for (const memberId of [...sabha.attendees, ...sabha.preparedBy])
      if (!db.members.some((m) => m._id === memberId))
        throw new AppError("One of the selected members no longer exists.");
    if (
      sabha.date.slice(0, 10) > today() &&
      (sabha.ingredientsUsed.length > 0 || sabha.attendees.length > 0)
    )
      throw new AppError(
        "Future sabhas can include a menu and cooks. Record attendance and ingredient usage on the day.",
      );

    const combined = new Map<
      string,
      { inventoryItemId: string; quantityUsed: number; unit: string }
    >();
    for (const ingredient of sabha.ingredientsUsed) {
      const item = db.inventory.find(
        (i) => i._id === ingredient.inventoryItemId,
      );
      if (!item || item.unit !== ingredient.unit)
        throw new AppError("Ingredient units must match the inventory unit.");
      const previous = combined.get(item._id);
      combined.set(item._id, {
        ...ingredient,
        quantityUsed: rounded(
          ingredient.quantityUsed + (previous?.quantityUsed || 0),
        ),
      });
    }
    sabha.ingredientsUsed = [...combined.values()];
    const old = existing as Sabha | undefined;
    const stockChanged =
      !old ||
      old.date.slice(0, 10) !== sabha.date.slice(0, 10) ||
      JSON.stringify(old.ingredientsUsed) !==
        JSON.stringify(sabha.ingredientsUsed);
    if (stockChanged) {
      if (old) reverseSabha(old);
      for (const ingredient of sabha.ingredientsUsed)
        addTransaction(
          ingredient.inventoryItemId,
          -ingredient.quantityUsed,
          "used-in-sabha",
          `Used for sabha on ${sabha.date.slice(0, 10)}`,
          recordId,
          sabha.date,
        );
    }
  }
  if (collection === "transactions") {
    const t = value as StockTransaction;
    return addTransaction(
      t.itemId,
      t.quantity,
      t.type,
      t.notes,
      undefined,
      t.date,
    );
  }
  if (existing) rows[rows.findIndex((r) => r._id === recordId)] = value;
  else rows.push(value);
  return value;
}
