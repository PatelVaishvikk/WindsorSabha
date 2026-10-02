"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Field, ErrorNotice } from "@/components/ui";
export default function Login() {
  const [username, setUsername] = useState("");
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="login-screen">
      <form
        className="login-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            router.push(d.redirectTo || "/inventory");
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="brand">
          <Image
            src="/hsapss-logo.png"
            alt="HSAPSS Canada"
            width={100}
            height={100}
            priority
            unoptimized
          />
        </div>
        <h1>Welcome to your community</h1>
        <p className="subtitle">Sign in with your full name and password.</p>
        <ErrorNotice message={error} />
        <div className="mb-4">
          <Field label="Full name">
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="words"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your full name"
            />
          </Field>
        </div>
        <Field label="Password">
          <input
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <button
          type="button"
          className="link mt-3"
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}{" "}
          {visible ? "Hide password" : "Show password"}
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? "Signing in…" : "Enter workspace"}
          <ArrowRight size={15} />
        </button>
      </form>
    </div>
  );
}
