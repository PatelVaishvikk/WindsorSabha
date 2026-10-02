import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
loadEnvConfig(process.cwd());
async function main() {
  const { connectDB } = await import("../lib/mongodb");
  const { Account } = await import("../models/account");
  const { models } = await import("../models");
  const { hashPassword, normalizeUsername } = await import("../lib/password");
  const adminPassword = process.env.ADMIN_PASSWORD;
  const memberPassword = process.env.MEMBER_INITIAL_PASSWORD;
  if (!adminPassword || !memberPassword)
    throw new Error(
      "Provide ADMIN_PASSWORD and MEMBER_INITIAL_PASSWORD for this explicit provisioning run.",
    );
  if (adminPassword.length < 8 || memberPassword.length < 8)
    throw new Error("Passwords must have at least eight characters.");
  await connectDB();
  await Account.init();
  const people = [
    "Vaishvik Patel",
    "Akash Patel",
    "Rushil Patel",
    "Harit Trivedi",
    "Dhwanit Tamboli",
    "Saral Mistry",
    "Anant Patel",
  ];
  const hashes = await Promise.all(
    people.map((_, i) =>
      hashPassword(i === 0 ? adminPassword : memberPassword),
    ),
  );
  await mongoose.connection.transaction(async (session) => {
    let mandal = await models.mandals
      .findOne({ name: "Windsor" })
      .session(session);
    if (!mandal)
      [mandal] = await models.mandals.create([{ name: "Windsor" }], {
        session,
      });
    for (const [i, fullName] of people.entries()) {
      let member = await models.members
        .findOne({ fullName, mandal: mandal._id })
        .session(session);
      if (!member)
        [member] = await models.members.create(
          [
            {
              fullName,
              mandal: mandal._id,
              contactNumber: "",
              email: "",
              studyStatus: "Not provided",
              institution: "",
              courseName: "",
              yearOfStudy: "",
              jobStatus: "Not provided",
              employer: "",
              jobTitle: "",
              partTimeJob: false,
              partTimeJobDetails: { employer: "", hoursPerWeek: 0 },
              immigrationStatus: "Not provided",
              indiaLocation: { state: "", city: "", village: "" },
              currentCanadaLocation: { city: "", province: "" },
              joinedDate: new Date(),
              isActive: true,
              notes: "",
            },
          ],
          { session },
        );
      await Account.findOneAndUpdate(
        { username: normalizeUsername(fullName) },
        {
          $set: {
            fullName,
            passwordHash: hashes[i],
            role: i === 0 ? "Admin" : "Viewer",
            permissions: { members: false, sabhas: false },
            memberId: member._id,
            isActive: true,
          },
          $inc: { sessionVersion: 1 },
        },
        {
          session,
          upsert: true,
          new: true,
          setDefaultsOnInsert: false,
          runValidators: true,
        },
      );
    }
  });
  console.log(
    "Provisioned Vaishvik Patel as main admin and six named member accounts. Members have stock-only access. No sample inventory or sabhas were created.",
  );
}
main()
  .catch((error) => {
    console.error("Account provisioning failed:", error.name);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
