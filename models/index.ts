import mongoose, { Schema } from "mongoose";
import {
  STUDY_STATUSES,
  JOB_STATUSES,
  IMMIGRATION_STATUSES,
  CATEGORIES,
  UNITS,
} from "@/lib/types";
const ref = (model: string) => ({ type: Schema.Types.ObjectId, ref: model });
const options = { timestamps: true, versionKey: false } as const;
const member = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dob: Date,
    mandal: { ...ref("Mandal"), required: true },
    contactNumber: String,
    email: String,
    studyStatus: { type: String, enum: STUDY_STATUSES },
    institution: String,
    courseName: String,
    yearOfStudy: String,
    jobStatus: { type: String, enum: JOB_STATUSES },
    employer: String,
    jobTitle: String,
    partTimeJob: Boolean,
    partTimeJobDetails: { employer: String, hoursPerWeek: Number },
    immigrationStatus: { type: String, enum: IMMIGRATION_STATUSES },
    indiaLocation: { state: String, city: String, village: String },
    currentCanadaLocation: { city: String, province: String },
    joinedDate: Date,
    isActive: { type: Boolean, default: true },
    notes: String,
  },
  options,
);
member.index({ mandal: 1, isActive: 1 });
member.index({ fullName: 1 });
const inventory = new Schema(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES },
    unit: { type: String, enum: UNITS },
    currentStock: { type: Number, min: 0, default: 0 },
    reorderThreshold: { type: Number, min: 0, default: 0 },
    lastRestockedDate: Date,
    costPerUnit: { type: Number, min: 0 },
  },
  options,
);
const sabha = new Schema(
  {
    date: { type: Date, required: true },
    mandal: { ...ref("Mandal"), required: true },
    attendees: [ref("Member")],
    dishesServed: [
      {
        _id: false,
        dishName: String,
        quantityPrepared: Number,
        servingUnit: String,
      },
    ],
    ingredientsUsed: [
      {
        _id: false,
        inventoryItemId: ref("InventoryItem"),
        quantityUsed: Number,
        unit: String,
      },
    ],
    preparedBy: [ref("Member")],
    notes: String,
  },
  options,
);
sabha.index({ date: -1, mandal: 1 });
const transaction = new Schema(
  {
    itemId: { ...ref("InventoryItem"), required: true },
    type: {
      type: String,
      enum: ["restock", "used-in-sabha", "adjustment"],
      required: true,
    },
    quantity: { type: Number, required: true },
    date: { type: Date, required: true },
    relatedSabhaId: ref("Sabha"),
    notes: String,
  },
  options,
);
transaction.index({ itemId: 1, date: -1 });
const dish = new Schema(
  {
    dishName: { type: String, required: true },
    standardIngredients: [
      {
        _id: false,
        item: ref("InventoryItem"),
        quantityPerServing: Number,
        unit: String,
      },
    ],
  },
  options,
);
export const models = {
  mandals:
    mongoose.models.Mandal ||
    mongoose.model(
      "Mandal",
      new Schema(
        { name: { type: String, required: true, unique: true } },
        options,
      ),
    ),
  members: mongoose.models.Member || mongoose.model("Member", member),
  inventory:
    mongoose.models.InventoryItem || mongoose.model("InventoryItem", inventory),
  sabhas: mongoose.models.Sabha || mongoose.model("Sabha", sabha),
  transactions:
    mongoose.models.StockTransaction ||
    mongoose.model("StockTransaction", transaction),
  dishes: mongoose.models.Dish || mongoose.model("Dish", dish),
};
