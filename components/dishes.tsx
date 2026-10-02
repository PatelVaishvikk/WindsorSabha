"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChefHat, ArrowLeft } from "lucide-react";
import type { AppData, Dish } from "@/lib/types";
import {
  Heading,
  SearchInput,
  Empty,
  Field,
  ErrorNotice,
  saveRecord,
  DeleteButton,
  fireToast,
} from "./ui";
export function DishTemplates({ data }: { data: AppData }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Dish> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <>
      <Link href="/sabhas" className="link mb-5">
        <ArrowLeft size={14} />
        Weekly sabhas
      </Link>
      <Heading
        title="Dish templates"
        description="Save a recipe once. Scale the ingredients for every gathering."
      >
        {data.role !== "Viewer" && (
          <button
            className="button primary"
            onClick={() =>
              setEditing({ dishName: "", standardIngredients: [] })
            }
          >
            <Plus size={14} />
            New template
          </button>
        )}
      </Heading>
      <ErrorNotice message={error} />
      {editing ? (
        <form
          className="panel form-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await saveRecord("dishes", editing, editing._id);
              fireToast(editing._id ? "Dish template updated" : "Dish template saved");
              setEditing(null);
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Dish name *">
            <input
              required
              value={editing.dishName}
              onChange={(e) =>
                setEditing({ ...editing, dishName: e.target.value })
              }
            />
          </Field>
          <p className="subtitle">
            Set the amount of each ingredient needed for one serving.
          </p>
          {editing.standardIngredients?.map((entry, index) => (
            <div key={index} className="inline-row">
              <Field label="Ingredient">
                <select
                  required
                  value={entry.item}
                  onChange={(e) => {
                    const item = data.inventory.find(
                      (i) => i._id === e.target.value,
                    );
                    setEditing({
                      ...editing,
                      standardIngredients: editing.standardIngredients?.map(
                        (v, i) =>
                          i === index
                            ? {
                                ...v,
                                item: e.target.value,
                                unit: item?.unit || "kg",
                              }
                            : v,
                      ),
                    });
                  }}
                >
                  <option value="">Choose inventory item</option>
                  {data.inventory.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.itemName} ({i.unit})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Quantity per serving (${entry.unit})`}>
                <input
                  required
                  type="number"
                  min="0.000001"
                  step="any"
                  value={entry.quantityPerServing}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      standardIngredients: editing.standardIngredients?.map(
                        (v, i) =>
                          i === index
                            ? {
                                ...v,
                                quantityPerServing: Number(e.target.value),
                              }
                            : v,
                      ),
                    })
                  }
                />
              </Field>
              <button
                className="icon-button mb-2"
                type="button"
                aria-label={`Remove ingredient ${index + 1}`}
                onClick={() =>
                  setEditing({
                    ...editing,
                    standardIngredients: editing.standardIngredients?.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button mt-5"
            onClick={() =>
              setEditing({
                ...editing,
                standardIngredients: [
                  ...(editing.standardIngredients || []),
                  { item: "", quantityPerServing: 0.1, unit: "kg" },
                ],
              })
            }
          >
            <Plus size={13} />
            Add ingredient
          </button>
          <div className="form-actions">
            <button
              type="button"
              className="button"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Saving…" : "Save template"}
            </button>
          </div>
        </form>
      ) : (
        <section className="panel">
          <div className="toolbar">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search dish templates…"
            />
          </div>
          {(() => {
            const filteredDishes = data.dishes.filter((d) =>
              d.dishName.toLowerCase().includes(q.toLowerCase()),
            );
            return filteredDishes.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>DISH</th>
                    <th>INGREDIENTS PER SERVING</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes
                    .map((d) => (
                      <tr key={d._id}>
                        <td>
                          <span className="flex items-center gap-3 table-name">
                            <ChefHat size={19} color="#ba9678" />
                            {d.dishName}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "normal" }}>
                          {d.standardIngredients.map((i, index) => (
                            <div key={index} className="text-xs text-gray-500">
                              {
                                data.inventory.find((v) => v._id === i.item)
                                  ?.itemName
                              }
                              : {i.quantityPerServing} {i.unit}
                            </div>
                          ))}
                        </td>
                        <td>
                          {data.role !== "Viewer" && (
                            <div className="flex gap-2">
                              <button
                                className="button small"
                                onClick={() => setEditing(d)}
                              >
                                Edit
                              </button>
                              <DeleteButton
                                collection="dishes"
                                id={d._id}
                                onDone={() => router.refresh()}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            ) : (
              <Empty
                title="No dish templates yet"
                description="Add a recipe with ingredient quantities per serving to make future sabhas easier."
              />
            );
          })()}
        </section>
      )}
    </>
  );
}
