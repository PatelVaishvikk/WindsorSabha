import { today } from "./format";
import { z } from "zod";
import {
  STUDY_STATUSES,
  JOB_STATUSES,
  IMMIGRATION_STATUSES,
  CATEGORIES,
  UNITS,
} from "./types";
const text = z.string().trim().max(2000).default("");
const id = z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid record");
const date = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(v) &&
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v.slice(0, 10),
    "Enter a valid date",
  );
const amount = z.number().finite().min(0).max(1000000);
export const memberSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(120),
    dob: z.union([date, z.literal("")]).optional(),
    mandal: id,
    contactNumber: text,
    email: z.union([z.string().email(), z.literal("")]).default(""),
    studyStatus: z.enum(STUDY_STATUSES),
    institution: text,
    courseName: text,
    yearOfStudy: text,
    jobStatus: z.enum(JOB_STATUSES),
    employer: text,
    jobTitle: text,
    partTimeJob: z.boolean().default(false),
    partTimeJobDetails: z
      .object({
        employer: text,
        hoursPerWeek: z.number().finite().min(0).max(168),
      })
      .default({ employer: "", hoursPerWeek: 0 }),
    immigrationStatus: z.enum(IMMIGRATION_STATUSES),
    indiaLocation: z
      .object({ state: text, city: text, village: text })
      .default({ state: "", city: "", village: "" }),
    currentCanadaLocation: z
      .object({ city: text, province: text })
      .default({ city: "", province: "" }),
    joinedDate: date,
    isActive: z.boolean().default(true),
    notes: text,
  })
  .refine((v) => !v.dob || v.dob.slice(0, 10) <= today(), {
    path: ["dob"],
    message: "Date of birth cannot be in the future",
  });
export const inventorySchema = z.object({
  itemName: z.string().trim().min(1).max(120),
  category: z.enum(CATEGORIES),
  unit: z.enum(UNITS),
  currentStock: amount.default(0),
  reorderThreshold: amount,
  costPerUnit: amount.optional(),
});
export const sabhaSchema = z.object({
  date,
  mandal: id,
  attendees: z
    .array(id)
    .max(5000)
    .transform((v) => [...new Set(v)]),
  dishesServed: z
    .array(
      z.object({
        dishName: z.string().trim().min(1).max(120),
        quantityPrepared: amount.positive(),
        servingUnit: z.string().trim().min(1).max(30),
      }),
    )
    .max(100),
  ingredientsUsed: z
    .array(
      z.object({
        inventoryItemId: id,
        quantityUsed: amount.positive(),
        unit: z.enum(UNITS),
      }),
    )
    .max(200),
  preparedBy: z
    .array(id)
    .max(500)
    .transform((v) => [...new Set(v)]),
  notes: text,
});
export const transactionSchema = z
  .object({
    itemId: id,
    type: z.enum(["restock", "adjustment"]),
    quantity: z
      .number()
      .finite()
      .min(-1000000)
      .max(1000000)
      .refine((v) => v !== 0, "Quantity must not be zero"),
    date,
    notes: text,
  })
  .refine((v) => v.type !== "restock" || v.quantity > 0, {
    path: ["quantity"],
    message: "Restock quantity must be positive",
  })
  .refine((v) => v.date.slice(0, 10) <= today(), {
    path: ["date"],
    message: "Stock transactions cannot be future dated",
  });
export const dishSchema = z.object({
  dishName: z.string().trim().min(1).max(120),
  standardIngredients: z
    .array(
      z.object({
        item: id,
        quantityPerServing: amount.positive(),
        unit: z.enum(UNITS),
      }),
    )
    .max(100),
});
export const mandalSchema = z.object({
  name: z.string().trim().min(1).max(120),
});
export function parseInput(collection: string, input: unknown) {
  switch (collection) {
    case "members":
      return memberSchema.parse(input);
    case "inventory":
      return inventorySchema.parse(input);
    case "sabhas":
      return sabhaSchema.parse(input);
    case "transactions":
      return transactionSchema.parse(input);
    case "dishes":
      return dishSchema.parse(input);
    case "mandals":
      return mandalSchema.parse(input);
    default:
      throw new Error("Unknown collection");
  }
}
