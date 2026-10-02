"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LockKeyhole } from "lucide-react";
import type { AccountUser } from "@/lib/types";
import { Heading, ErrorNotice, apiFetch, fireToast } from "./ui";
function AccountRow({ account }: { account: AccountUser }) {
  const [permissions, setPermissions] = useState(account.permissions);
  const [active, setActive] = useState(account.isActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const admin = account.role === "Admin";
  return (
    <tr>
      <td>
        <strong>{account.fullName}</strong>
        <div className="sub">{account.username}</div>
      </td>
      <td>
        <span className={`badge ${admin ? "orange" : "green"}`}>
          {admin ? "Main administrator" : "Member"}
        </span>
      </td>
      <td>
        <span className="badge green">
          <LockKeyhole size={11} />
          Always visible
        </span>
      </td>
      <td>
        <input
          type="checkbox"
          aria-label={`Member directory access for ${account.fullName}`}
          disabled={admin || busy}
          checked={admin || permissions.members}
          onChange={(e) => {
            setSaved(false);
            setPermissions({ ...permissions, members: e.target.checked });
          }}
        />
      </td>
      <td>
        <input
          type="checkbox"
          aria-label={`Sabha access for ${account.fullName}`}
          disabled={admin || busy}
          checked={admin || permissions.sabhas}
          onChange={(e) => {
            setSaved(false);
            setPermissions({ ...permissions, sabhas: e.target.checked });
          }}
        />
      </td>
      <td>
        <input
          type="checkbox"
          aria-label={`Account active for ${account.fullName}`}
          disabled={admin || busy}
          checked={active}
          onChange={(e) => {
            setSaved(false);
            setActive(e.target.checked);
          }}
        />
      </td>
      <td>
        {admin ? (
          <span className="text-xs text-gray-400">Protected account</span>
        ) : (
          <>
            <button
              className="button small"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                setSaved(false);
                try {
                  await apiFetch(`/api/accounts/${account.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ permissions, isActive: active }),
                  });
                  setSaved(true);
                  fireToast(`Access updated for ${account.fullName}`);
                  router.refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Saving…" : saved ? "Saved" : "Save access"}
            </button>
            <ErrorNotice message={error} />
            {saved && (
              <span role="status" className="sr-only">
                Access saved for {account.fullName}
              </span>
            )}
          </>
        )}
      </td>
    </tr>
  );
}
export function AccessManager({ accounts }: { accounts: AccountUser[] }) {
  return (
    <>
      <Heading
        eyebrow="MAIN ADMINISTRATOR"
        title="Member access"
        description="Choose which sections each member can view. Only you can edit records and change permissions."
      />
      <div className="notice">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} />
          <strong>Stock-only access by default</strong>
        </div>
        <p className="mt-2">
          Members can view inventory balances. Enable the member directory or
          sabhas individually. Sabha access includes dish templates and
          attendee/cook names. Overview, stock transaction notes, and all
          editing remain admin-only.
        </p>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>ROLE</th>
                <th>STOCK</th>
                <th>MEMBER DIRECTORY</th>
                <th>SABHAS & DISHES</th>
                <th>ACTIVE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <AccountRow key={account.id} account={account} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          Access changes apply on the next request, including for members who
          are already signed in.
        </div>
      </section>
    </>
  );
}
