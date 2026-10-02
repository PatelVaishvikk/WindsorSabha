import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { connectDB } from "./mongodb";
import { Account } from "@/models/account";
import { publicAccount } from "./access";
import type { AccountUser } from "./types";
import { AppError } from "./operations";
const issuer = "sabha-management";
const audience = "sabha-workspace";
export async function getSession(): Promise<AccountUser | null> {
  const token = cookies().get("sabha-session")?.value;
  if (!token || (process.env.SESSION_SECRET?.length || 0) < 32) return null;
  let claims;
  try {
    claims = (
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.SESSION_SECRET),
        { algorithms: ["HS256"], issuer, audience },
      )
    ).payload;
  } catch {
    return null;
  }
  if (
    !claims.sub ||
    !/^[a-f\d]{24}$/i.test(claims.sub) ||
    typeof claims.sessionVersion !== "number"
  )
    return null;
  await connectDB();
  const account = await Account.findById(claims.sub).lean();
  if (
    !account ||
    !account.isActive ||
    account.sessionVersion !== claims.sessionVersion
  )
    return null;
  return publicAccount(account);
}
export async function getRole() {
  return (await getSession())?.role || null;
}
export async function requireUser(adminOnly = false) {
  const user = await getSession();
  if (!user) throw new AppError("Please sign in to continue.", 401);
  if (adminOnly && user.role !== "Admin")
    throw new AppError("Only the main administrator can make changes.", 403);
  return user;
}
export async function createSession(user: AccountUser) {
  if ((process.env.SESSION_SECRET?.length || 0) < 32)
    throw new AppError("Sign-in is not configured.", 503);
  return new SignJWT({ sessionVersion: user.sessionVersion })
    .setSubject(user.id)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET));
}
