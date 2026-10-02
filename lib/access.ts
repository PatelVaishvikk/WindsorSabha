import type { AccountUser, Collection, Section } from "./types";
export const homeFor = (user: AccountUser) =>
  user.role === "Admin" ? "/dashboard" : "/inventory";
export function canView(user: AccountUser, section: Section): boolean {
  if (user.role === "Admin") return true;
  if (section === "inventory") return true;
  if (section === "members" || section === "sabhas")
    return user.permissions[section] === true;
  return false;
}
export function canReadCollection(
  user: AccountUser,
  collection: Collection,
): boolean {
  if (user.role === "Admin") return true;
  if (collection === "inventory") return true;
  if (collection === "members") return canView(user, "members");
  if (collection === "sabhas" || collection === "dishes")
    return canView(user, "sabhas");
  if (collection === "mandals")
    return canView(user, "members") || canView(user, "sabhas");
  return false;
}
export function publicAccount(account: any): AccountUser {
  return {
    id: String(account._id),
    fullName: account.fullName,
    username: account.username,
    role: account.role === "Admin" ? "Admin" : "Viewer",
    permissions: {
      members: !!account.permissions?.members,
      sabhas: !!account.permissions?.sabhas,
    },
    isActive: account.isActive === true,
    sessionVersion: account.sessionVersion,
  };
}
