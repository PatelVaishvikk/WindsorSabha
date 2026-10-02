"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  ArrowLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  ShoppingBasket,
} from "lucide-react";
import type { AppData, InventoryItem } from "@/lib/types";
import { CATEGORIES, UNITS } from "@/lib/types";
import { today, dateLabel, number } from "@/lib/format";
import {
  Heading,
  SearchInput,
  SelectFilter,
  Empty,
  Field,
  ErrorNotice,
  saveRecord,
  DeleteButton,
  fireToast,
} from "./ui";
export function InventoryList({ data }: { data: AppData }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const low = data.inventory.filter(
    (i) => i.currentStock <= i.reorderThreshold,
  );
  const filtered = data.inventory
    .filter(
      (i) =>
        (!q || i.itemName.toLowerCase().includes(q.toLowerCase())) &&
        (!category || i.category === category) &&
        (!stock ||
          (stock === "low"
            ? i.currentStock <= i.reorderThreshold
            : i.currentStock > i.reorderThreshold)),
    )
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
  return (
    <>
      <Heading
        eyebrow="THE COMMUNITY KITCHEN"
        title="Grocery & inventory"
        description="A well-stocked kitchen. Mahaprasad made with care."
      >
        {data.role !== "Viewer" && (
          <div className="two-buttons">
            <Link className="button" href="/inventory/new">
              <Plus size={14} />
              Add item
            </Link>
            <Link className="button primary" href="/inventory/restock">
              <ShoppingBasket size={15} />
              Restock groceries
            </Link>
          </div>
        )}
      </Heading>
      <div
        className="stats"
        style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}
      >
        {[
          {
            label: "Inventory items",
            value: data.inventory.length,
            note: "Essentials for our kitchen",
          },
          {
            label: "Need a restock",
            value: low.length,
            note: "At or below minimum stock",
          },
          {
            label: "Estimated stock value",
            value: `$${number(data.inventory.reduce((s, i) => s + i.currentStock * (i.costPerUnit || 0), 0))}`,
            note: "CAD · based on recorded unit costs",
          },
        ].map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat-top">
              {s.label}
              <Package size={16} color="#c7ad8e" />
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-foot">{s.note}</div>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Kitchen essentials</h2>
          <span className="badge orange">{low.length} low-stock items</span>
        </div>
        <div className="toolbar">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search groceries…"
          />
          <SelectFilter
            label="All categories"
            value={category}
            onChange={setCategory}
            options={[...CATEGORIES]}
          />
          <SelectFilter
            label="All stock levels"
            value={stock}
            onChange={setStock}
            options={[
              { value: "low", label: "Low stock" },
              { value: "healthy", label: "In stock" },
            ]}
          />
        </div>
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>CATEGORY</th>
                  <th>CURRENT STOCK</th>
                  <th>MINIMUM STOCK</th>
                  <th>STATUS</th>
                  <th>LAST RESTOCKED</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i._id}>
                    <td>
                      <Link
                        className="flex items-center gap-3 table-name"
                        href={`/inventory/${i._id}`}
                      >
                        <span className="item-icon">
                          <Package size={17} />
                        </span>
                        {i.itemName}
                      </Link>
                    </td>
                    <td>{i.category}</td>
                    <td
                      className={
                        i.currentStock <= i.reorderThreshold
                          ? "text-orange font-medium"
                          : ""
                      }
                    >
                      {number(i.currentStock)}{" "}
                      <span className="text-gray-400 text-[11px]">
                        {i.unit}
                      </span>
                    </td>
                    <td>
                      {number(i.reorderThreshold)} {i.unit}
                    </td>
                    <td>
                      <span
                        className={`badge ${i.currentStock === 0 ? "red" : i.currentStock <= i.reorderThreshold ? "orange" : "green"}`}
                      >
                        {i.currentStock === 0
                          ? "Out of stock"
                          : i.currentStock <= i.reorderThreshold
                            ? "Low stock"
                            : "In stock"}
                      </span>
                    </td>
                    <td>
                      {i.lastRestockedDate
                        ? dateLabel(i.lastRestockedDate)
                        : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/inventory/${i._id}`}
                        aria-label={`View ${i.itemName}`}
                      >
                        <ChevronRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No items found"
            description="Try another filter or add a grocery item to your kitchen."
          />
        )}
        <div className="table-footer">
          {filtered.length} items · Stock updates automatically when a sabha is
          logged.
        </div>
      </section>
    </>
  );
}
export function InventoryForm({
  data,
  item,
  onCancel,
}: {
  data: AppData;
  item?: InventoryItem;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Omit<InventoryItem, "_id">>(
    item || {
      itemName: "",
      category: "Grains",
      unit: "kg",
      currentStock: 0,
      reorderThreshold: 0,
      costPerUnit: 0,
    },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  if (data.role === "Viewer") return <Empty title="View-only access" />;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const saved = await saveRecord("inventory", form, item?._id);
          fireToast(item ? "Item updated" : "Item added to inventory");
          router.push(`/inventory/${saved._id}`);
          router.refresh();
          onCancel?.();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <ErrorNotice message={error} />
      <div className="panel form-panel">
        <h2>Item details</h2>
        <p className="subtitle">
          Keep quantities in the same unit for accurate stock tracking.
        </p>
        <div className="form-grid">
          <Field label="Item name *">
            <input
              required
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Stock unit">
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              disabled={
                !!item && data.transactions.some((t) => t.itemId === item._id)
              }
            >
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          {!item && (
            <Field label="Opening stock">
              <input
                required
                type="number"
                step="any"
                min="0"
                value={form.currentStock}
                onChange={(e) =>
                  setForm({ ...form, currentStock: Number(e.target.value) })
                }
              />
            </Field>
          )}
          <Field label={`Reorder threshold (${form.unit})`}>
            <input
              required
              type="number"
              step="any"
              min="0"
              value={form.reorderThreshold}
              onChange={(e) =>
                setForm({ ...form, reorderThreshold: Number(e.target.value) })
              }
            />
          </Field>
          <Field label={`Cost per ${form.unit} (CAD, optional)`}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costPerUnit ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  costPerUnit: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />
          </Field>
        </div>
        <div className="form-actions">
          {onCancel ? (
            <button type="button" className="button" onClick={onCancel}>
              Cancel
            </button>
          ) : (
            <Link className="button" href="/inventory">
              Cancel
            </Link>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : item ? "Save changes" : "Add inventory item"}
          </button>
        </div>
      </div>
    </form>
  );
}
export function StockForm({
  data,
  initialItem = "",
  adjustment = false,
  onDone,
}: {
  data: AppData;
  initialItem?: string;
  adjustment?: boolean;
  onDone?: () => void;
}) {
  const [itemId, setItemId] = useState(
    initialItem || data.inventory[0]?._id || "",
  );
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const item = data.inventory.find((i) => i._id === itemId);
  if (data.role === "Viewer") return <Empty title="View-only access" />;
  if (!data.inventory.length)
    return (
      <div className="panel p-8">
        <Empty
          title="Add your first grocery item"
          description="An inventory item is needed before you can record a purchase."
        />
        <Link className="button primary" href="/inventory/new">
          Add item
        </Link>
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await saveRecord("transactions", {
            itemId,
            type: adjustment ? "adjustment" : "restock",
            quantity: Number(quantity),
            date,
            notes,
          });
          fireToast(adjustment ? "Stock adjustment saved" : "Restock recorded");
          router.push(`/inventory/${itemId}`);
          router.refresh();
          onDone?.();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <ErrorNotice message={error} />
      <div className="panel form-panel">
        <h2>{adjustment ? "Adjust stock" : "Log a grocery purchase"}</h2>
        <p className="subtitle">
          {adjustment
            ? "Use a positive number to add stock or a negative number to remove it."
            : "Your purchase will be added to inventory and the stock history."}
        </p>
        <div className="form-grid">
          <Field label="Inventory item *">
            <select
              required
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              {data.inventory.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.itemName} ({i.unit})
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Quantity (${item?.unit || "units"}) *`}>
            <input
              required
              type="number"
              step="any"
              min={adjustment ? undefined : "0.000001"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field label="Date *">
            <input
              required
              type="date"
              max={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <div className="self-center text-sm text-gray-500">
            Current stock:{" "}
            <strong className="text-gray-700">
              {number(item?.currentStock || 0)} {item?.unit}
            </strong>
            <br />
            After {adjustment ? "adjustment" : "restock"}:{" "}
            <strong className="text-orange">
              {number((item?.currentStock || 0) + Number(quantity))}{" "}
              {item?.unit}
            </strong>
          </div>
          <Field
            label={adjustment ? "Reason for adjustment *" : "Purchase notes"}
            wide
          >
            <textarea
              required={adjustment}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                adjustment
                  ? "E.g. stock count correction, damaged packaging…"
                  : "Store, receipt number, or anything helpful…"
              }
            />
          </Field>
        </div>
        <div className="form-actions">
          {onDone ? (
            <button type="button" className="button" onClick={onDone}>
              Cancel
            </button>
          ) : (
            <Link href="/inventory" className="button">
              Cancel
            </Link>
          )}
          <button className="button primary" disabled={busy}>
            {busy
              ? "Saving…"
              : adjustment
                ? "Save adjustment"
                : "Record restock"}
          </button>
        </div>
      </div>
    </form>
  );
}
export function InventoryDetail({
  data,
  item,
}: {
  data: AppData;
  item: InventoryItem;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "adjust">("view");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const router = useRouter();
  const transactions = data.transactions
    .filter(
      (t) =>
        t.itemId === item._id &&
        (!type || t.type === type) &&
        (!q ||
          [t.notes, t.date, t.type].some((v) =>
            v.toLowerCase().includes(q.toLowerCase()),
          )),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Link href="/inventory" className="link mb-5">
        <ArrowLeft size={14} />
        Grocery & inventory
      </Link>
      <Heading
        title={item.itemName}
        description={`${item.category} · Tracked in ${item.unit}`}
      >
        {data.role !== "Viewer" && mode === "view" && (
          <div className="profile-actions">
            <DeleteButton
              collection="inventory"
              id={item._id}
              onDone={() => {
                router.push("/inventory");
                router.refresh();
              }}
            />
            <button className="button" onClick={() => setMode("edit")}>
              Edit item
            </button>
            <Link
              href={`/inventory/restock?item=${item._id}`}
              className="button primary"
            >
              <Plus size={14} />
              Restock
            </Link>
          </div>
        )}
      </Heading>
      {mode === "edit" ? (
        <InventoryForm
          data={data}
          item={item}
          onCancel={() => setMode("view")}
        />
      ) : mode === "adjust" ? (
        <StockForm
          data={data}
          initialItem={item._id}
          adjustment
          onDone={() => setMode("view")}
        />
      ) : (
        <>
          <div
            className="stats"
            style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}
          >
            <div className="stat">
              <div className="stat-top">Current stock</div>
              <div className="stat-value">
                {number(item.currentStock)}{" "}
                <span className="text-sm text-gray-400">{item.unit}</span>
              </div>
              <div className="stat-foot">
                <span
                  className={`badge ${item.currentStock <= item.reorderThreshold ? "orange" : "green"}`}
                >
                  {item.currentStock <= item.reorderThreshold
                    ? "Needs a restock"
                    : "In stock"}
                </span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-top">Reorder threshold</div>
              <div className="stat-value">
                {number(item.reorderThreshold)}{" "}
                <span className="text-sm text-gray-400">{item.unit}</span>
              </div>
              <div className="stat-foot">Minimum to keep on hand</div>
            </div>
            <div className="stat">
              <div className="stat-top">Cost per {item.unit}</div>
              <div className="stat-value">
                {item.costPerUnit !== undefined
                  ? "$" + number(item.costPerUnit)
                  : "—"}
              </div>
              <div className="stat-foot">Canadian dollars</div>
            </div>
          </div>
          {data.role === "Admin" && (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Stock history</h2>
                  <p>Every purchase, sabha, and adjustment in one place.</p>
                </div>

                <button
                  className="button small"
                  onClick={() => setMode("adjust")}
                >
                  <SlidersHorizontal size={13} />
                  Adjust stock
                </button>
              </div>
              <div className="toolbar">
                <SearchInput
                  value={q}
                  onChange={setQ}
                  placeholder="Search stock history…"
                />
                <SelectFilter
                  label="All transactions"
                  value={type}
                  onChange={setType}
                  options={[
                    { value: "restock", label: "Restock" },
                    { value: "used-in-sabha", label: "Used in sabha" },
                    { value: "adjustment", label: "Adjustment" },
                  ]}
                />
              </div>
              {transactions.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>TRANSACTION</th>
                        <th>QUANTITY</th>
                        <th>NOTES</th>
                        <th>RELATED SABHA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t._id}>
                          <td>{dateLabel(t.date)}</td>
                          <td>
                            <span
                              className={`badge ${t.type === "restock" ? "green" : t.type === "used-in-sabha" ? "orange" : ""}`}
                            >
                              {t.type === "used-in-sabha"
                                ? "Used in sabha"
                                : t.type === "restock"
                                  ? "Restock"
                                  : "Adjustment"}
                            </span>
                          </td>
                          <td
                            className={
                              t.quantity > 0 ? "text-green" : "text-orange"
                            }
                          >
                            {t.quantity > 0 ? "+" : ""}
                            {number(t.quantity)} {item.unit}
                          </td>
                          <td style={{ whiteSpace: "normal", maxWidth: 330 }}>
                            {t.notes || "—"}
                          </td>
                          <td>
                            {t.relatedSabhaId ? (
                              data.sabhas.some(
                                (s) => s._id === t.relatedSabhaId,
                              ) ? (
                                <Link
                                  href={`/sabhas/${t.relatedSabhaId}`}
                                  className="link"
                                >
                                  View sabha
                                  <ChevronRight size={12} />
                                </Link>
                              ) : (
                                <span className="text-gray-400">
                                  Deleted sabha
                                </span>
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="No transactions found" />
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
