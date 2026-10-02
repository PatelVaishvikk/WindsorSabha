export const STUDY_STATUSES = [
  "Not provided",
  "Student",
  "Graduated",
  "Not Studying",
] as const;
export const JOB_STATUSES = [
  "Not provided",
  "Full-Time",
  "Part-Time",
  "Unemployed",
  "Student",
] as const;
export const IMMIGRATION_STATUSES = [
  "Not provided",
  "Citizen",
  "PR",
  "Work Permit",
  "Study Permit",
  "Visitor",
  "Other",
] as const;
export const CATEGORIES = [
  "Vegetables",
  "Grains",
  "Spices",
  "Dairy",
  "Oil",
  "Pulses",
  "Other",
] as const;
export const UNITS = ["kg", "liter", "packet", "piece"] as const;
export type Role = "Admin" | "Viewer";
export type Section =
  "inventory" | "members" | "sabhas" | "dashboard" | "access";
export interface AccountUser {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  permissions: { members: boolean; sabhas: boolean };
  isActive: boolean;
  sessionVersion: number;
}
export interface Mandal {
  _id: string;
  name: string;
}
export interface Member {
  _id: string;
  fullName: string;
  dob?: string;
  mandal: string;
  contactNumber: string;
  email: string;
  studyStatus: (typeof STUDY_STATUSES)[number];
  institution: string;
  courseName: string;
  yearOfStudy: string;
  jobStatus: (typeof JOB_STATUSES)[number];
  employer: string;
  jobTitle: string;
  partTimeJob: boolean;
  partTimeJobDetails: { employer: string; hoursPerWeek: number };
  immigrationStatus: (typeof IMMIGRATION_STATUSES)[number];
  indiaLocation: { state: string; city: string; village: string };
  currentCanadaLocation: { city: string; province: string };
  joinedDate: string;
  isActive: boolean;
  notes: string;
}
export interface InventoryItem {
  _id: string;
  itemName: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  lastRestockedDate?: string;
  costPerUnit?: number;
}
export interface Ingredient {
  inventoryItemId: string;
  quantityUsed: number;
  unit: string;
}
export interface Sabha {
  _id: string;
  date: string;
  mandal: string;
  attendees: string[];
  dishesServed: {
    dishName: string;
    quantityPrepared: number;
    servingUnit: string;
  }[];
  ingredientsUsed: Ingredient[];
  preparedBy: string[];
  notes: string;
}
export interface Dish {
  _id: string;
  dishName: string;
  standardIngredients: {
    item: string;
    quantityPerServing: number;
    unit: string;
  }[];
}
export interface StockTransaction {
  _id: string;
  itemId: string;
  type: "restock" | "used-in-sabha" | "adjustment";
  quantity: number;
  date: string;
  relatedSabhaId?: string;
  notes: string;
}
export interface Database {
  mandals: Mandal[];
  members: Member[];
  sabhas: Sabha[];
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  dishes: Dish[];
}
export type Collection = keyof Database;
export interface AppData extends Database {
  user: AccountUser;
  role: Role;
}
