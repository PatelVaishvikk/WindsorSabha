import mongoose from "mongoose";
const globalDb = globalThis as typeof globalThis & {
  mongoPromise?: Promise<typeof mongoose>;
};
export async function connectDB() {
  if (!process.env.MONGODB_URI)
    throw new Error("Set MONGODB_URI to connect your database.");
  if (!globalDb.mongoPromise)
    globalDb.mongoPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
        autoIndex: process.env.NODE_ENV !== "production",
      })
      .catch((error) => {
        globalDb.mongoPromise = undefined;
        throw error;
      });
  return globalDb.mongoPromise;
}
