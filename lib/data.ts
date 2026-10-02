import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { configurationIssues } from "./config";
import { canView, canReadCollection, homeFor } from "./access";
import { connectDB } from "./mongodb";
import { models } from "@/models";
import type { AppData, Section, Collection, Database } from "./types";
export async function getData(
  section: Section,
  write = false,
): Promise<AppData> {
  if (configurationIssues().length) redirect("/setup");
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canView(user, section) || (write && user.role !== "Admin"))
    redirect(homeFor(user));
  await connectDB();
  const data: Database = {
    members: [],
    mandals: [],
    sabhas: [],
    inventory: [],
    transactions: [],
    dishes: [],
  };
  // Filter before serialization: hiding a tab alone never protects member data.
  await Promise.all(
    (Object.keys(data) as Collection[]).map(async (key) => {
      if (canReadCollection(user, key)) {
        data[key] = JSON.parse(JSON.stringify(await models[key].find().lean()));
      } else if (
        key === "members" &&
        section === "sabhas" &&
        canView(user, "sabhas")
      ) {
        // Sabha visibility includes attendee/cook names, never their private profiles.
        data.members = JSON.parse(
          JSON.stringify(
            await models.members
              .find()
              .select("_id fullName mandal isActive")
              .lean(),
          ),
        );
      }
    }),
  );
  return { ...data, role: user.role, user };
}
