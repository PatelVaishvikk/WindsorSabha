"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarDays,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Clock,
  MapPin,
  ChefHat,
  AlertTriangle,
  ChevronRight,
  Plus,
  ShoppingBasket,
} from "lucide-react";
import type { AppData } from "@/lib/types";
import { dateLabel, today, number } from "@/lib/format";
import { Heading, Empty, ViewLink } from "./ui";
export function Dashboard({ data }: { data: AppData }) {
  const [mandal, setMandal] = useState("");
  const now = today();
  const members = data.members.filter((m) => !mandal || m.mandal === mandal);
  const all = data.sabhas.filter((s) => !mandal || s.mandal === mandal);
  const past = all
    .filter((s) => s.date.slice(0, 10) <= now)
    .sort((a, b) => b.date.localeCompare(a.date));
  const next = all
    .filter((s) => s.date.slice(0, 10) > now)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const low = data.inventory.filter(
    (i) => i.currentStock <= i.reorderThreshold,
  );
  const active = members.filter((m) => m.isActive).length;
  const average = past.length
    ? Math.round(past.reduce((n, s) => n + s.attendees.length, 0) / past.length)
    : 0;
  const chartData = past.slice(0, 6).reverse();
  const max = Math.max(...chartData.map((s) => s.attendees.length), 10) * 1.2;
  const points = chartData.map(
    (s, i) =>
      `${40 + i * (560 / Math.max(chartData.length - 1, 1))},${160 - (s.attendees.length / max) * 135}`,
  );
  const coordinates = points.join(" ");
  const mandalName = (id: string) =>
    data.mandals.find((m) => m._id === id)?.name || "Mandal";
  return (
    <>
      <Heading
        eyebrow="YOUR COMMUNITY, AT A GLANCE"
        title="Sabha overview"
        description="A little planning. A stronger community."
      >
        <div className="two-buttons">
          <select
            aria-label="Dashboard mandal"
            className="filter"
            value={mandal}
            onChange={(e) => setMandal(e.target.value)}
          >
            <option value="">All mandals</option>
            {data.mandals.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
          {data.role !== "Viewer" && (
            <Link href="/sabhas/new" className="button primary">
              <Plus size={15} />
              Log a sabha
            </Link>
          )}
        </div>
      </Heading>
      {!data.mandals.length && data.role !== "Viewer" && (
        <div className="notice">
          <strong>Start your community workspace.</strong>
          <p className="mt-1">
            Add your first mandal and member, then stock the kitchen and plan a
            sabha.
          </p>
          <Link className="button primary mt-3" href="/members/new">
            Add your first member & mandal
          </Link>
        </div>
      )}
      <div className="stats">
        {[
          {
            label: "Active members",
            value: active,
            icon: Users,
            bg: "#fff1e8",
            color: "#db8151",
            foot: `Across ${mandal ? 1 : data.mandals.length} mandals`,
            green: false,
          },
          {
            label: "Sabhas held",
            value: past.length,
            icon: CalendarDays,
            bg: "#eef2fc",
            color: "#8294cb",
            foot: "Gathering, learning, growing",
            green: false,
          },
          {
            label: "Average attendance",
            value: average,
            icon: TrendingUp,
            bg: "#edf5ef",
            color: "#78a08a",
            foot: "Members per sabha",
            green: true,
          },
          {
            label: "Low-stock items",
            value: low.length,
            icon: Package,
            bg: "#fff5e7",
            color: "#c79957",
            foot: low.length
              ? "A little restock is needed"
              : data.inventory.length
                ? "Your kitchen is well stocked"
                : "Add your kitchen essentials",
            green: false,
          },
        ].map((stat) => (
          <div className="stat" key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <span
                className="stat-icon"
                style={{ background: stat.bg, color: stat.color }}
              >
                <stat.icon size={17} strokeWidth={1.6} />
              </span>
            </div>
            <div className="stat-value">
              {stat.value}
              <span className="text-sm font-normal text-gray-400 ml-2">
                {stat.label === "Average attendance" ? "members" : ""}
              </span>
            </div>
            <div className={`stat-foot ${stat.green ? "text-green" : ""}`}>
              {stat.green && <Users size={11} />} {stat.foot}
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Growing together</h2>
                <p>Attendance at your last six sabhas</p>
              </div>
              <span className="legend">Members attended</span>
            </div>
            {chartData.length ? (
              <>
                <div className="chart-wrap">
                  <svg
                    viewBox="0 0 630 185"
                    className="chart"
                    role="img"
                    aria-label={`Attendance: ${chartData.map((s) => dateLabel(s.date) + ": " + s.attendees.length).join(", ")}`}
                  >
                    <defs>
                      <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#e78453"
                          stopOpacity=".2"
                        />
                        <stop
                          offset="100%"
                          stopColor="#e78453"
                          stopOpacity=".015"
                        />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((t) => (
                      <g key={t}>
                        <line
                          className="chart-grid"
                          x1="37"
                          x2="612"
                          y1={25 + t * 45}
                          y2={25 + t * 45}
                        />
                        <text x="9" y={29 + t * 45}>
                          {Math.round((max * (3 - t)) / 3)}
                        </text>
                      </g>
                    ))}
                    <polygon
                      fill="url(#area)"
                      points={`40,160 ${coordinates} ${points[points.length - 1]?.split(",")[0]},160`}
                    />
                    <polyline
                      points={coordinates}
                      fill="none"
                      stroke="#e4865b"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.split(",")[0]}
                        cy={p.split(",")[1]}
                        r="4"
                        fill="white"
                        stroke="#e4865b"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                  <div className="chart-days">
                    {chartData.map((s) => (
                      <span key={s._id}>
                        {dateLabel(s.date, { month: "short", day: "numeric" })}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <Empty
                title="Your community story starts here"
                description="Log your first sabha to see attendance over time."
              />
            )}
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Recent sabhas</h2>
                <p>Moments of satsang, seva, and connection</p>
              </div>
              <ViewLink href="/sabhas" />
            </div>
            {past.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>SABHA</th>
                      <th>ATTENDANCE</th>
                      <th>MAHAPRASAD</th>
                      <th aria-label="Details" />
                    </tr>
                  </thead>
                  <tbody>
                    {past.slice(0, 5).map((s) => (
                      <tr key={s._id}>
                        <td>
                          <Link href={`/sabhas/${s._id}`} className="date-cell">
                            <span className="date-block">
                              {dateLabel(s.date, { day: "numeric" })}
                              <small>
                                {dateLabel(s.date, { month: "short" })}
                              </small>
                            </span>
                            <span>
                              <span className="table-name">
                                {mandalName(s.mandal)} sabha
                              </span>
                              <div className="sub">
                                {dateLabel(s.date, {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className="flex gap-1.5 items-center">
                            <Users size={12} className="text-gray-400" />
                            {s.attendees.length}
                            <span className="text-gray-400 text-[10px]">
                              members
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="badge">
                            {s.dishesServed[0]?.dishName || "No dishes logged"}
                          </span>
                          {s.dishesServed.length > 1 && (
                            <span className="text-[10px] text-gray-400 ml-1">
                              +{s.dishesServed.length - 1}
                            </span>
                          )}
                        </td>
                        <td>
                          <Link
                            href={`/sabhas/${s._id}`}
                            aria-label={`View ${dateLabel(s.date)} sabha`}
                          >
                            <ChevronRight size={15} className="text-gray-400" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No sabhas logged yet" />
            )}
            <div className="table-footer">
              <span>Every gathering makes a difference.</span>
              <CalendarDays size={13} />
            </div>
          </section>
        </div>
        <div className="stack">
          <section className="panel upcoming">
            <div className="flex justify-between">
              <span className="tag">UP NEXT</span>
              <CalendarDays size={19} color="#c99570" />
            </div>
            {next ? (
              <>
                <h2>{mandalName(next.mandal)} weekly sabha</h2>
                <div className="meta">
                  <CalendarDays size={14} />
                  {dateLabel(next.date, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="meta">
                  <MapPin size={14} />
                  {mandalName(next.mandal)}, Ontario
                </div>
                <div className="divider" />
                <div className="flex items-center gap-2 text-xs text-[#897c70]">
                  <ChefHat size={15} />
                  {next.dishesServed.map((d) => d.dishName).join(" · ") ||
                    "Menu to be planned"}
                </div>
                <Link
                  className="button mt-5 w-full"
                  style={{
                    borderColor: "#ecd7c6",
                    background: "transparent",
                    color: "#a06d48",
                  }}
                  href={`/sabhas/${next._id}`}
                >
                  View sabha details
                  <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <>
                <h2>The next gathering awaits</h2>
                <p className="subtitle">
                  Plan a sabha to bring everyone together.
                </p>
                {data.role !== "Viewer" && (
                  <Link href="/sabhas/new" className="button mt-5">
                    Plan a sabha
                    <Plus size={14} />
                  </Link>
                )}
              </>
            )}
          </section>
          <section className="panel">
            <div className="panel-head">
              <div className="flex items-center gap-2">
                <h2>Kitchen check-in</h2>
                {low.length > 0 && (
                  <span className="badge orange">{low.length} low</span>
                )}
              </div>
              <ShoppingBasket size={17} color="#b2a18b" />
            </div>
            <div className="panel-body">
              {low.length ? (
                low.slice(0, 3).map((item) => (
                  <Link
                    href={`/inventory/${item._id}`}
                    className="item-row"
                    key={item._id}
                  >
                    <span className="item-icon">
                      <Package size={17} strokeWidth={1.5} />
                    </span>
                    <span className="grow">
                      <strong>{item.itemName}</strong>
                      <p>
                        Minimum {number(item.reorderThreshold)} {item.unit}
                      </p>
                    </span>
                    <span className="stock-value">
                      {number(item.currentStock)}{" "}
                      <span className="text-[10px]">{item.unit}</span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-green">
                  {data.inventory.length
                    ? "Everything is ready for the kitchen."
                    : "No inventory items yet."}
                </p>
              )}
              <Link
                href={
                  data.role === "Viewer" ? "/inventory" : "/inventory/restock"
                }
                className="link mt-5"
              >
                {data.role === "Viewer"
                  ? "View inventory"
                  : "Restock the essentials"}
                <ArrowRight size={13} />
              </Link>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Our mandals</h2>
                <p>A shared path, a growing family</p>
              </div>
              <Users size={17} color="#9ca4ae" />
            </div>
            <div className="panel-body">
              {data.mandals
                .filter((m) => !mandal || mandal === m._id)
                .map((m, i) => {
                  const count = data.members.filter(
                    (p) => p.mandal === m._id && p.isActive,
                  ).length;
                  return (
                    <Link
                      href={`/members?mandal=${m._id}`}
                      className="block mandal-row"
                      key={m._id}
                    >
                      <div className="mandal-info">
                        <span>{m.name}</span>
                        <span>{count} members</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(count / Math.max(active, 1)) * 100}%`,
                            background: ["#df946f", "#a5b6a6", "#a7b4cc"][
                              i % 3
                            ],
                          }}
                        />
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
