import { z } from "zod";
import { Account } from "@/models/account";
import { connectDB } from "./mongodb";
import { AppError } from "./operations";
import { publicAccount } from "./access";
const schema = z
  .object({
    permissions: z
      .object({ members: z.boolean(), sabhas: z.boolean() })
      .strict(),
    isActive: z.boolean(),
  })
  .strict();
export async function updateAccountAccess(id: string, raw: unknown) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new AppError("Account not found.", 404);
  const input = schema.parse(raw);
  await connectDB();
  const account = await Account.findOneAndUpdate(
    { _id: id, role: "Viewer" },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!account)
    throw new AppError(
      "Account not found or this is the protected main administrator.",
      400,
    );
  return publicAccount(account);
}
