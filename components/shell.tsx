"use client";
import Image from "next/image";
import { canView, homeFor } from "@/lib/access";
import { initials } from "@/lib/format";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  X,
  ShieldCheck,
  LayoutDashboard,
  Users,
  CalendarDays,
  Package,
  ChevronRight,
  MapPin,
  Menu,
  LogOut,
  Home,
} from "lucide-react";
import type { AccountUser, Section } from "@/lib/types";
import { apiFetch, ToastContainer } from "./ui";
const nav = [
  { href: "/dashboard", title: "Overview", icon: LayoutDashboard },
  { href: "/members", title: "Youth members", icon: Users },
  { href: "/sabhas", title: "Weekly sabhas", icon: CalendarDays },
  { href: "/inventory", title: "Grocery & inventory", icon: Package },
  { href: "/access", title: "Member access", icon: ShieldCheck },
];
export function Shell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AccountUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (pathname === "/login" || pathname === "/setup") return children;
  const role = user?.role;
  const visibleNav = nav.filter(
    (n) => user && canView(user, n.href.slice(1) as Section),
  );
  const current = nav.find((n) => pathname.startsWith(n.href)) || nav[0];
  return (
    <>
      <div
        className={`mob-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className="icon-button menu-button" style={{position:"absolute",top:6,right:6}} aria-label="Close navigation" onClick={()=>setOpen(false)}><X size={18}/></button>
        <Link
          href={user ? homeFor(user) : "/login"}
          className="brand"
          aria-label="Sabha home"
        >
          <Image
            src="/hsapss-logo.png"
            alt="HSAPSS Canada"
            width={48}
            height={48}
            unoptimized
          />
          <div>
            <div className="brand-name">
              sabha<span className="text-orange">.</span>
            </div>
            <small>HSAPSS CANADA</small>
          </div>
        </Link>
        <div className="nav-section">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {visibleNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`nav-link ${pathname.startsWith(n.href) ? "active" : ""}`}
              aria-current={pathname.startsWith(n.href) ? "page" : undefined}
            >
              <n.icon size={18} strokeWidth={1.7} />
              {n.title}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="community-card">
            <div className="mini-label">OUR COMMUNITY</div>
            <div className="flex items-center gap-2 mt-3">
              <MapPin size={15} className="text-orange" />
              <strong className="text-xs font-medium">Windsor, Ontario</strong>
            </div>
            <p>Growing together in satsang.</p>
          </div>
          <div className="sidebar-footer">
            Haridham • HSAPSS Canada
            <br />
            <span className="text-[10px]">Sabha Management System</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-button"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <Home size={14} />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{current.title}</strong>
          </div>
          <div className="top-actions">
            <div className="user">
              <span className="avatar">{initials(user?.fullName || "")}</span>
              <div className="user-text">
                <strong>{user?.fullName || "Welcome"}</strong>
                <small>
                  {role === "Viewer"
                    ? "Member · view only"
                    : "Main administrator"}
                </small>
              </div>
              {role && (
                <button
                  className="icon-button"
                  title="Sign out"
                  onClick={async () => {
                    try {
                      await apiFetch("/api/auth", { method: "DELETE", body: JSON.stringify({}) });
                    } catch {
                      window.alert("Unable to sign out. Please try again.");
                      return;
                    }
                    router.push("/login");
                    router.refresh();
                  }}
                >
                  <LogOut size={16} />
                  <span className="sr-only">Sign out</span>
                </button>
              )}
            </div>
          </div>
        </header>
        <main className="content">
          {children}
          <footer className="footer">
            <span>Made for our community. Rooted in seva.</span>
            <span>HSAPSS Canada · Windsor mandal</span>
          </footer>
        </main>
      </div>
      <ToastContainer />
    </>
  );
}
