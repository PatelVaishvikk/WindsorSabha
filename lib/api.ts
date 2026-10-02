import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "./auth";
import { requireSameOrigin, readJson } from "./request";
import { mutate } from "./store";
import { AppError } from "./operations";
import { canReadCollection } from "./access";
import { connectDB } from "./mongodb";
import { models } from "@/models";
import type { Collection } from "./types";
const collections = [
  "members",
  "sabhas",
  "inventory",
  "transactions",
  "dishes",
  "mandals",
];
export async function handle(
  request: NextRequest,
  collection: string,
  id?: string,
) {
  try {
    if (!collections.includes(collection)) throw new AppError("Not found", 404);
    const write = request.method !== "GET";
    const user = await requireUser(write);
    if (!canReadCollection(user, collection as Collection))
      throw new AppError("You do not have access to this section.", 403);
    if (write) requireSameOrigin(request);
    if (id && !/^[a-f\d]{24}$/i.test(id)) throw new AppError("Not found", 404);
    const key = collection as Collection;
    if (!write) {
      await connectDB();
      const records = JSON.parse(
        JSON.stringify(await models[key].find().lean()),
      ) as { _id: string }[];
      if (id) {
        const item = records.find((r) => r._id === id);
        if (!item) throw new AppError("Not found", 404);
        return NextResponse.json(item);
      }
      let rows: unknown[] = records;
      const q = request.nextUrl.searchParams.get("q")?.toLowerCase();
      if (q)
        rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
      for (const filter of [
        "mandal",
        "immigrationStatus",
        "jobStatus",
        "isActive",
        "category",
        "itemId",
        "type",
      ]) {
        const value = request.nextUrl.searchParams.get(filter);
        if (value)
          rows = rows.filter(
            (r) => String((r as Record<string, unknown>)[filter]) === value,
          );
      }
      return NextResponse.json(rows);
    }
    const input = request.method === "DELETE" ? {} : await readJson(request);
    const result = await mutate(
      key,
      request.method === "POST"
        ? "create"
        : request.method === "DELETE"
          ? "delete"
          : "update",
      input,
      id,
    );
    return NextResponse.json(result, {
      status: request.method === "POST" ? 201 : 200,
    });
  } catch (e) {
    if (e instanceof ZodError)
      return NextResponse.json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 422 },
      );
    if (e && typeof e === "object" && "code" in e && e.code === 11000)
      return NextResponse.json(
        { error: "This record already exists." },
        { status: 409 },
      );
    if (e instanceof AppError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(
      "API request failed:",
      e instanceof Error ? e.name : "UnknownError",
    );
    return NextResponse.json(
      {
        error:
          "Unable to save or load data. Check your database connection and replica-set configuration.",
      },
      { status: 500 },
    );
  }
}
