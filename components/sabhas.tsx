"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  ChefHat,
  Plus,
  ArrowLeft,
  ChevronRight,
  Trash2,
  Sparkles,
  Check,
} from "lucide-react";
import type { AppData, Sabha, Ingredient, Member } from "@/lib/types";
import { today, dateLabel, initials, number } from "@/lib/format";
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
export function SabhaList({ data }: { data: AppData }) {
  const [q, setQ] = useState("");
  const [mandal, setMandal] = useState("");
  const [period, setPeriod] = useState("");
  const now = today();
  const rows = data.sabhas
    .filter(
      (s) =>
        (!mandal || s.mandal === mandal) &&
        (!period ||
          (period === "upcoming"
            ? s.date.slice(0, 10) > now
            : s.date.slice(0, 10) <= now)) &&
        (!q ||
          [
            s.date,
            s.notes,
            data.mandals.find((m) => m._id === s.mandal)?.name || "",
            ...s.dishesServed.map((d) => d.dishName),
          ].some((v) => v.toLowerCase().includes(q.toLowerCase()))),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Heading
        eyebrow="SATSANG, SEVA & TOGETHERNESS"
        title="Weekly sabhas"
        description="Plan the next gathering. Remember the moments that brought us together."
        action={
          data.role !== "Viewer"
            ? { href: "/sabhas/new", label: "Log a sabha" }
            : undefined
        }
      />
      <section className="panel">
        <div className="panel-head">
          <h2>
            Our gatherings{" "}
            <span className="badge ml-2">{data.sabhas.length}</span>
          </h2>
          <Link href="/dishes" className="link">
            <ChefHat size={14} />
            Dish templates
          </Link>
        </div>
        <div className="toolbar">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Search sabhas, dates or dishes…"
          />
          <SelectFilter
            label="All mandals"
            value={mandal}
            onChange={setMandal}
            options={data.mandals.map((m) => ({ value: m._id, label: m.name }))}
          />
          <SelectFilter
            label="All sabhas"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past & today" },
            ]}
          />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SABHA DATE</th>
                  <th>MANDAL</th>
                  <th>ATTENDANCE</th>
                  <th>MAHAPRASAD</th>
                  <th>PREPARED BY</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <Link href={`/sabhas/${s._id}`} className="date-cell">
                        <span className="date-block">
                          {dateLabel(s.date, { day: "numeric" })}
                          <small>{dateLabel(s.date, { month: "short" })}</small>
                        </span>
                        <span className="table-name">
                          {dateLabel(s.date)}
                          <div className="sub">
                            {dateLabel(s.date, { weekday: "long" })}
                          </div>
                        </span>
                      </Link>
                    </td>
                    <td>
                      {data.mandals.find((m) => m._id === s.mandal)?.name}
                    </td>
                    <td>
                      <span className="flex items-center gap-2">
                        <Users size={13} color="#99a1ab" />
                        {s.attendees.length} members
                      </span>
                    </td>
                    <td>
                      {s.dishesServed.slice(0, 2).map((d) => (
                        <span key={d.dishName} className="badge mr-1">
                          {d.dishName}
                        </span>
                      ))}
                      {s.dishesServed.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{s.dishesServed.length - 2}
                        </span>
                      )}
                    </td>
                    <td>{s.preparedBy.length} volunteers</td>
                    <td>
                      <span
                        className={`badge ${s.date.slice(0, 10) > now ? "orange" : "green"}`}
                      >
                        {s.date.slice(0, 10) > now ? "Upcoming" : "Completed"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/sabhas/${s._id}`}
                        aria-label={`View sabha on ${dateLabel(s.date)}`}
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
            title="No sabhas found"
            description="Try a different search or log a new gathering."
          />
        )}
        <div className="table-footer">
          {rows.length} gatherings · Made meaningful by our members.
        </div>
      </section>
    </>
  );
}
function MemberPicker({
  members,
  selected,
  onChange,
  label,
}: {
  members: Member[];
  selected: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  const [q, setQ] = useState("");
  const filtered = members.filter(
    (m) =>
      (m.isActive || selected.includes(m._id)) &&
      m.fullName.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="flex items-center justify-between gap-3 mt-4">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder={`Search ${label.toLowerCase()}…`}
        />
        <span className="badge orange">{selected.length} selected</span>
      </div>
      <div className="selection-grid">
        {filtered.map((m) => (
          <label
            key={m._id}
            className={`member-option ${selected.includes(m._id) ? "selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(m._id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...selected, m._id]
                    : selected.filter((id) => id !== m._id),
                )
              }
            />
            <span>{m.fullName}</span>
          </label>
        ))}
      </div>
      {!filtered.length && (
        <p className="text-xs text-gray-400 mt-4">No matching members.</p>
      )}
    </>
  );
}
export function SabhaForm({
  data,
  sabha,
  onCancel,
}: {
  data: AppData;
  sabha?: Sabha;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Omit<Sabha, "_id">>(() =>
    sabha
      ? { ...sabha, date: sabha.date.slice(0, 10) }
      : {
          date: today(),
          mandal: data.mandals[0]?._id || "",
          attendees: [],
          dishesServed: [],
          ingredientsUsed: [],
          preparedBy: [],
          notes: "",
        },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState("");
  const [servings, setServings] = useState(25);
  const [ingredientId, setIngredientId] = useState(
    data.inventory[0]?._id || "",
  );
  const router = useRouter();
  const future = form.date > today();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const addDish = () => {
    const dish = data.dishes.find((d) => d._id === template);
    if (!dish) return;
    const dishes = [
      ...form.dishesServed,
      {
        dishName: dish.dishName,
        quantityPrepared: servings,
        servingUnit: "servings",
      },
    ];
    const ingredients = [...form.ingredientsUsed];
    if (!future) {
      for (const entry of dish.standardIngredients) {
        const found = ingredients.findIndex(
          (i) => i.inventoryItemId === entry.item,
        );
        if (found >= 0)
          ingredients[found] = {
            ...ingredients[found],
            quantityUsed: Number(
              (
                ingredients[found].quantityUsed +
                entry.quantityPerServing * servings
              ).toFixed(6),
            ),
          };
        else
          ingredients.push({
            inventoryItemId: entry.item,
            quantityUsed: Number(
              (entry.quantityPerServing * servings).toFixed(6),
            ),
            unit: entry.unit,
          });
      }
    }
    setForm({ ...form, dishesServed: dishes, ingredientsUsed: ingredients });
    setTemplate("");
  };
  if (data.role === "Viewer")
    return (
      <Empty
        title="View-only access"
        description="Only the administrator can log or edit sabhas."
      />
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const saved = await saveRecord("sabhas", form, sabha?._id);
          fireToast(sabha ? "Sabha updated" : "Sabha saved");
          router.push(`/sabhas/${saved._id}`);
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
      {!data.mandals.length && (
        <div className="notice">
          Add a mandal in the{" "}
          <Link href="/members/new" className="underline">
            new member form
          </Link>{" "}
          before logging a sabha.
        </div>
      )}
      <section className="panel form-panel">
        <h2>The gathering</h2>
        <p className="subtitle">
          Choose a date and the mandal coming together.
        </p>
        <div className="form-grid">
          <Field label="Sabha date *">
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Mandal *">
            <select
              required
              value={form.mandal}
              onChange={(e) => set("mandal", e.target.value)}
            >
              <option value="">Select a mandal</option>
              {data.mandals.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>
      <section className="panel form-panel">
        <h2>Attendance</h2>
        <p className="subtitle">
          Check in members who joined the sabha. Guests from other mandals are
          welcome.
        </p>
        {future && (
          <div className="notice">
            You’re planning a future sabha. Add the menu and cooks now; record
            attendance and ingredient usage on the day.
          </div>
        )}
        <MemberPicker
          members={data.members}
          selected={form.attendees}
          onChange={(v) => set("attendees", v)}
          label="members"
        />
      </section>
      <section className="panel form-panel">
        <div className="flex justify-between items-center gap-3">
          <div>
            <h2>Mahaprasad menu</h2>
            <p className="subtitle">
              Choose a dish template to suggest ingredients for your serving
              count.
            </p>
          </div>
          <Link href="/dishes" className="link">
            Dish templates
            <ChevronRight size={13} />
          </Link>
        </div>
        <div className="inline-row">
          <Field label="Dish template">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              <option value="">Choose a dish…</option>
              {data.dishes.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.dishName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Servings">
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
            />
          </Field>
          <button
            type="button"
            className="button"
            disabled={!template || servings <= 0}
            onClick={addDish}
          >
            <Plus size={14} />
            Add dish
          </button>
        </div>
        {form.dishesServed.map((d, index) => (
          <div className="inline-row" key={index}>
            <Field label="Dish name *">
              <input
                required
                value={d.dishName}
                onChange={(e) =>
                  set(
                    "dishesServed",
                    form.dishesServed.map((v, i) =>
                      i === index ? { ...v, dishName: e.target.value } : v,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Quantity prepared *">
              <input
                required
                type="number"
                min="0.000001"
                step="any"
                value={d.quantityPrepared}
                onChange={(e) =>
                  set(
                    "dishesServed",
                    form.dishesServed.map((v, i) =>
                      i === index
                        ? { ...v, quantityPrepared: Number(e.target.value) }
                        : v,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Serving unit">
              <input
                required
                value={d.servingUnit}
                placeholder="servings, pieces…"
                onChange={(e) =>
                  set(
                    "dishesServed",
                    form.dishesServed.map((v, i) =>
                      i === index ? { ...v, servingUnit: e.target.value } : v,
                    ),
                  )
                }
              />
            </Field>
            <button
              type="button"
              className="icon-button mb-1.5"
              aria-label={`Remove dish ${index + 1}`}
              onClick={() =>
                set(
                  "dishesServed",
                  form.dishesServed.filter((_, i) => i !== index),
                )
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="link mt-5"
          onClick={() =>
            set("dishesServed", [
              ...form.dishesServed,
              { dishName: "", quantityPrepared: 25, servingUnit: "servings" },
            ])
          }
        >
          <Plus size={13} />
          Add a custom dish
        </button>
      </section>
      <section className="panel form-panel">
        <h2>Ingredients used</h2>
        <p className="subtitle">
          Review actual quantities before saving. These amounts will be deducted
          from stock.
        </p>
        <p className="edit-note">
          Changing or removing a menu row does not change the actual ingredients
          below. Adjust usage to match what was cooked.
        </p>
        {form.ingredientsUsed.map((ingredient, index) => {
          const item = data.inventory.find(
            (i) => i._id === ingredient.inventoryItemId,
          );
          const original =
            sabha?.ingredientsUsed
              .filter((i) => i.inventoryItemId === ingredient.inventoryItemId)
              .reduce((n, i) => n + i.quantityUsed, 0) || 0;
          const available = (item?.currentStock || 0) + original;
          return (
            <div className="inline-row" key={ingredient.inventoryItemId}>
              <div className="field">
                <span>{item?.itemName || "Missing item"}</span>
                <p
                  className={
                    ingredient.quantityUsed > available
                      ? "text-red text-xs"
                      : "text-gray-400 text-xs"
                  }
                >
                  {number(available)} {item?.unit} available
                </p>
              </div>
              <Field label={`Quantity used (${ingredient.unit}) *`}>
                <input
                  required
                  type="number"
                  min="0.000001"
                  step="any"
                  value={ingredient.quantityUsed}
                  onChange={(e) =>
                    set(
                      "ingredientsUsed",
                      form.ingredientsUsed.map((v, i) =>
                        i === index
                          ? { ...v, quantityUsed: Number(e.target.value) }
                          : v,
                      ),
                    )
                  }
                />
              </Field>
              <button
                type="button"
                className="icon-button mb-1.5"
                aria-label={`Remove ${item?.itemName}`}
                onClick={() =>
                  set(
                    "ingredientsUsed",
                    form.ingredientsUsed.filter((_, i) => i !== index),
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
        <div className="inline-row">
          <Field label="Add an ingredient">
            <select
              value={ingredientId}
              onChange={(e) => setIngredientId(e.target.value)}
            >
              <option value="">Choose an item…</option>
              {data.inventory
                .filter(
                  (i) =>
                    !form.ingredientsUsed.some(
                      (g) => g.inventoryItemId === i._id,
                    ),
                )
                .map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.itemName} ({i.unit})
                  </option>
                ))}
            </select>
          </Field>
          <button
            type="button"
            className="button"
            disabled={
              !ingredientId ||
              form.ingredientsUsed.some(
                (g) => g.inventoryItemId === ingredientId,
              )
            }
            onClick={() => {
              const item = data.inventory.find((i) => i._id === ingredientId);
              if (item) {
                set("ingredientsUsed", [
                  ...form.ingredientsUsed,
                  {
                    inventoryItemId: item._id,
                    quantityUsed: 1,
                    unit: item.unit,
                  },
                ]);
                setIngredientId("");
              }
            }}
          >
            <Plus size={14} />
            Add ingredient
          </button>
        </div>
      </section>
      <section className="panel form-panel">
        <h2>Kitchen seva</h2>
        <p className="subtitle">
          Recognize the volunteers who prepared mahaprasad.
        </p>
        <MemberPicker
          members={data.members}
          selected={form.preparedBy}
          onChange={(v) => set("preparedBy", v)}
          label="cooks"
        />
        <div className="mt-6">
          <Field label="Sabha notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Topics covered, special moments, or plans for next time…"
            />
          </Field>
        </div>
      </section>
      <ErrorNotice message={error} />
      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="button" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <Link className="button" href="/sabhas">
            Cancel
          </Link>
        )}
        <button className="button primary" disabled={busy}>
          {busy
            ? "Saving sabha…"
            : sabha
              ? "Save changes"
              : future
                ? "Plan sabha"
                : "Save sabha & update stock"}
        </button>
      </div>
    </form>
  );
}
export function SabhaDetail({ data, sabha }: { data: AppData; sabha: Sabha }) {
  const [edit, setEdit] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Local attendees state to avoid stale-prop bug when rapidly checking in members
  const [localAttendees, setLocalAttendees] = useState<string[]>(sabha.attendees);
  const router = useRouter();
  const mandal = data.mandals.find((m) => m._id === sabha.mandal)?.name;
  const upcoming = sabha.date.slice(0, 10) > today();
  const checked = data.members.filter((m) => localAttendees.includes(m._id));
  const [checkIn, setCheckIn] = useState(false);
  const members = (
    checkIn
      ? data.members.filter(
          (m) => m.isActive || localAttendees.includes(m._id),
        )
      : checked
  ).filter((m) => m.fullName.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Link href="/sabhas" className="link mb-5">
        <ArrowLeft size={14} />
        Weekly sabhas
      </Link>
      <Heading
        title={edit ? "Edit sabha" : `${mandal} weekly sabha`}
        description={dateLabel(sabha.date, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      >
        {!edit && data.role !== "Viewer" && (
          <div className="profile-actions">
            <DeleteButton
              collection="sabhas"
              id={sabha._id}
              onDone={() => {
                router.push("/sabhas");
                router.refresh();
              }}
            />
            <button className="button primary" onClick={() => setEdit(true)}>
              Edit sabha
            </button>
          </div>
        )}
      </Heading>
      {edit ? (
        <SabhaForm data={data} sabha={sabha} onCancel={() => setEdit(false)} />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
            <span className={`badge ${upcoming ? "orange" : "green"}`}>
              {upcoming ? "Upcoming" : "Completed"}
            </span>
            <span className="text-xs text-gray-500">
              {localAttendees.length} attendees · {sabha.dishesServed.length}{" "}
              dishes · {sabha.preparedBy.length} kitchen volunteers
            </span>
          </div>
          <ErrorNotice message={error} />
          <div className="detail-grid">
            <div className="stack">
              <section className="panel">
                <div className="panel-head">
                  <h2>
                    Attendance{" "}
                    <span className="badge ml-1">{checked.length}</span>
                  </h2>
                  {data.role !== "Viewer" && !upcoming && (
                    <button
                      className="button small"
                      onClick={() => setCheckIn(!checkIn)}
                    >
                      {checkIn ? "View attendees" : "Check in members"}
                    </button>
                  )}
                </div>
                <div className="panel-body">
                  <SearchInput
                    value={q}
                    onChange={setQ}
                    placeholder="Find a member…"
                  />
                  {members.length ? (
                    <div className="selection-grid">
                      {members.map((m) => (
                        <div
                          className={`member-option ${localAttendees.includes(m._id) ? "selected" : ""}`}
                          key={m._id}
                        >
                          {checkIn ? (
                            <input
                              type="checkbox"
                              aria-label={`Check in ${m.fullName}`}
                              disabled={busy}
                              checked={localAttendees.includes(m._id)}
                              onChange={async (e) => {
                                const attendees = e.target.checked
                                  ? [...localAttendees, m._id]
                                  : localAttendees.filter(
                                      (id) => id !== m._id,
                                    );
                                setLocalAttendees(attendees);
                                setBusy(true);
                                setError("");
                                try {
                                  await saveRecord(
                                    "sabhas",
                                    { ...sabha, attendees, ingredientsUsed: sabha.ingredientsUsed },
                                    sabha._id,
                                  );
                                  fireToast(e.target.checked ? `${m.fullName} checked in` : `${m.fullName} removed`);
                                  router.refresh();
                                } catch (e) {
                                  setLocalAttendees(localAttendees); // revert on error
                                  setError((e as Error).message);
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            />
                          ) : (
                            <Check size={14} className="text-green" />
                          )}
                          <Link href={`/members/${m._id}`}>{m.fullName}</Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={
                        upcoming ? "See you at the sabha" : "No attendees found"
                      }
                      description={
                        upcoming
                          ? "Check in members on the day of the gathering."
                          : "Use “Check in members” to record attendance."
                      }
                    />
                  )}
                </div>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <h2>Ingredients used</h2>
                  <PackageIcon />
                </div>
                {sabha.ingredientsUsed.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>INGREDIENT</th>
                          <th>QUANTITY USED</th>
                          <th>STOCK STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sabha.ingredientsUsed.map((i) => (
                          <tr key={i.inventoryItemId}>
                            <td>
                              <Link
                                href={`/inventory/${i.inventoryItemId}`}
                                className="table-name"
                              >
                                {
                                  data.inventory.find(
                                    (v) => v._id === i.inventoryItemId,
                                  )?.itemName
                                }
                              </Link>
                            </td>
                            <td>
                              {number(i.quantityUsed)} {i.unit}
                            </td>
                            <td>
                              <span className="badge green">
                                Deducted from stock
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="No ingredient usage logged"
                    description="Record actual quantities when mahaprasad is prepared."
                  />
                )}
              </section>
              {sabha.notes && (
                <section className="panel form-panel mb-0">
                  <h2>Sabha notes</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mt-4">
                    {sabha.notes}
                  </p>
                </section>
              )}
            </div>
            <div className="stack">
              <section className="panel">
                <div className="panel-head">
                  <h2>Mahaprasad menu</h2>
                  <ChefHat size={18} color="#bb9a7a" />
                </div>
                <div className="panel-body">
                  {sabha.dishesServed.length ? (
                    sabha.dishesServed.map((d, i) => (
                      <div className="item-row" key={i}>
                        <div className="grow">
                          <strong>{d.dishName}</strong>
                          <p>
                            {number(d.quantityPrepared)} {d.servingUnit}
                          </p>
                        </div>
                        <ChefHat size={16} color="#b5a496" />
                      </div>
                    ))
                  ) : (
                    <Empty title="Menu to be planned" />
                  )}
                </div>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <h2>Prepared with seva</h2>
                </div>
                <div className="panel-body">
                  {sabha.preparedBy.length ? (
                    sabha.preparedBy.map((id) => {
                      const m = data.members.find((m) => m._id === id);
                      return m ? (
                        <Link
                          href={`/members/${id}`}
                          className="item-row"
                          key={id}
                        >
                          <span className="avatar">{initials(m.fullName)}</span>
                          <div>
                            <strong>{m.fullName}</strong>
                            <p>Kitchen volunteer</p>
                          </div>
                        </Link>
                      ) : null;
                    })
                  ) : (
                    <Empty
                      title="No cooks assigned"
                      description="Add the volunteers preparing this meal."
                    />
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
function PackageIcon() {
  return <ChefHat size={18} color="#b3a18e" />;
}
