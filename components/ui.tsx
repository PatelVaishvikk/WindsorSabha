"use client";
import Link from "next/link";
import { cloneElement, isValidElement, useId, useState, useEffect, useCallback } from "react";
import { Search, Plus, ArrowRight, Inbox, CheckCircle, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Central fetch helper — always sends Origin so the CSRF check passes
// ---------------------------------------------------------------------------
export async function apiFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: window.location.origin,
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save. Please try again.");
  return data;
}

export async function saveRecord(collection: string, body: unknown, id?: string) {
  return apiFetch(`/api/${collection}${id ? "/" + id : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
type Toast = { id: number; message: string; type: "success" | "error" };
let toastId = 0;
const listeners = new Set<(t: Toast) => void>();

export function fireToast(message: string, type: Toast["type"] = "success") {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <CheckCircle size={15} />
          <span>{t.message}</span>
          <button
            className="icon-button"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
export function Heading({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p className="subtitle">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="button primary">
          <Plus size={15} />
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-box">
      <Search size={16} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <select
      className="filter"
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}</option>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        return (
          <option key={v} value={v}>
            {typeof o === "string" ? o : o.label}
          </option>
        );
      })}
    </select>
  );
}

export function Empty({
  title = "Nothing here yet",
  description = "Add a record to get started.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  return (
    <div className={`field ${wide ? "span-2" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {isValidElement<{ id?: string }>(children)
        ? cloneElement(children, { id })
        : children}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <div className="notice error-notice" role="alert">
      {message}
    </div>
  ) : null;
}

export function ViewLink({
  href,
  label = "View all",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link href={href} className="link">
      {label}
      <ArrowRight size={13} />
    </Link>
  );
}

export function DeleteButton({
  collection,
  id,
  label = "Delete",
  onDone,
}: {
  collection: string;
  id: string;
  label?: string;
  onDone: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div>
      <ErrorNotice message={error} />
      {confirm ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-red-700">Delete this record?</span>
          <button
            className="button danger small"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await apiFetch(`/api/${collection}/${id}`, { method: "DELETE", body: JSON.stringify({}) });
                fireToast(`${label} deleted`);
                onDone();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Deleting…" : "Confirm delete"}
          </button>
          <button className="button small" onClick={() => setConfirm(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="button danger small"
          onClick={() => setConfirm(true)}
        >
          Delete
        </button>
      )}
    </div>
  );
}
