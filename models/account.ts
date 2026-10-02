import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";
const schema = new Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["Admin", "Viewer"],
      default: "Viewer",
      required: true,
    },
    permissions: {
      members: { type: Boolean, default: false },
      sabhas: { type: Boolean, default: false },
    },
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 1 },
  },
  { timestamps: true, versionKey: false },
);
export type AccountRecord = InferSchemaType<typeof schema>;
export const Account: Model<AccountRecord> =
  (mongoose.models.Account as Model<AccountRecord>) ||
  mongoose.model<AccountRecord>("Account", schema);
