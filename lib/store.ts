import type { ClientSession } from "mongoose";
import { models } from "@/models";
import { connectDB } from "./mongodb";
import { Account } from "@/models/account";
import { AppError, applyMutation } from "./operations";
import type { Database, Collection } from "./types";
export async function readDatabase(session?: ClientSession): Promise<Database> {
  await connectDB();
  const data = {} as Database;
  // A MongoDB transaction must execute operations sequentially on its session.
  for (const key of Object.keys(models) as Collection[]) {
    const query = models[key].find().lean();
    if (session) query.session(session);
    (data[key] as unknown) = JSON.parse(JSON.stringify(await query));
  }
  return data;
}
export async function mutate(
  collection: Collection,
  method: "create" | "update" | "delete",
  input: unknown,
  id?: string,
) {
  const mongoose = await connectDB();
  return mongoose.connection.transaction(async (session) => {
    if (
      collection === "members" &&
      method === "delete" &&
      (await Account.exists({ memberId: id }).session(session))
    )
      throw new AppError(
        "This member has a sign-in account. Mark the profile inactive or disable their account in Member access instead.",
      );
    const before = await readDatabase(session);
    const after = structuredClone(before);
    const result = applyMutation(after, collection, method, input, id);
    for (const key of Object.keys(models) as Collection[]) {
      const oldRows = new Map(before[key].map((r) => [r._id, r]));
      const newRows = new Map(after[key].map((r) => [r._id, r]));
      for (const [rowId, row] of newRows) {
        const old = oldRows.get(rowId);
        if (!old) await models[key].create([row], { session });
        else if (JSON.stringify(old) !== JSON.stringify(row))
          await models[key].replaceOne({ _id: rowId }, row, {
            session,
            runValidators: true,
          });
      }
      for (const rowId of oldRows.keys())
        if (!newRows.has(rowId))
          await models[key].deleteOne({ _id: rowId }, { session });
    }
    return result;
  });
}
