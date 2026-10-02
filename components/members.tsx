"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Plus,
  ArrowLeft,
} from "lucide-react";
import {
  AppData,
  Member,
  STUDY_STATUSES,
  JOB_STATUSES,
  IMMIGRATION_STATUSES,
} from "@/lib/types";
import { dateLabel, initials, today } from "@/lib/format";
import {
  Heading,
  SearchInput,
  SelectFilter,
  Empty,
  Field,
  ErrorNotice,
  saveRecord,
  DeleteButton,
  fireToast,
} from "./ui";
export function MemberList({
  data,
  initialMandal = "",
}: {
  data: AppData;
  initialMandal?: string;
}) {
  const [q, setQ] = useState("");
  const [mandal, setMandal] = useState(initialMandal);
  const [immigration, setImmigration] = useState("");
  const [job, setJob] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(0);
  const filtered = data.members
    .filter(
      (m) =>
        (!q ||
          [m.fullName, m.email, m.contactNumber].some((s) =>
            s.toLowerCase().includes(q.toLowerCase()),
          )) &&
        (!mandal || m.mandal === mandal) &&
        (!immigration || m.immigrationStatus === immigration) &&
        (!job || m.jobStatus === job) &&
        (!active || String(m.isActive) === active),
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 12) - 1),
  );
  const members = filtered.slice(currentPage * 12, currentPage * 12 + 12);
  return (
    <>
      <Heading
        eyebrow="PEOPLE & CONNECTION"
        title="Youth members"
        description="Know your community. Help every member feel at home."
        action={
          data.role !== "Viewer"
            ? { href: "/members/new", label: "Add member" }
            : undefined
        }
      />
      <div className="panel">
        <div className="panel-head">
          <h2>
            Member directory{" "}
            <span className="badge ml-2">{data.members.length}</span>
          </h2>
          <span className="text-xs text-gray-400">
            {data.members.filter((m) => m.isActive).length} active members
          </span>
        </div>
        <div className="toolbar">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(0);
            }}
            placeholder="Search name, email or phone…"
          />
          <SelectFilter
            label="All mandals"
            value={mandal}
            onChange={setMandal}
            options={data.mandals.map((m) => ({ value: m._id, label: m.name }))}
          />
          <SelectFilter
            label="Immigration status"
            value={immigration}
            onChange={setImmigration}
            options={[...IMMIGRATION_STATUSES]}
          />
          <SelectFilter
            label="Job status"
            value={job}
            onChange={setJob}
            options={[...JOB_STATUSES]}
          />
          <SelectFilter
            label="All members"
            value={active}
            onChange={setActive}
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
        </div>
        {members.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>MANDAL</th>
                  <th>CONTACT</th>
                  <th>STUDY / WORK</th>
                  <th>IMMIGRATION</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m._id}>
                    <td>
                      <Link
                        href={`/members/${m._id}`}
                        className="flex items-center gap-3"
                      >
                        <span
                          className="avatar"
                          style={{
                            background: ["#f4e9df", "#e7edf0", "#e9eee4"][
                              i % 3
                            ],
                          }}
                        >
                          {initials(m.fullName)}
                        </span>
                        <span className="table-name">{m.fullName}</span>
                      </Link>
                    </td>
                    <td>
                      {data.mandals.find((a) => a._id === m.mandal)?.name}
                    </td>
                    <td>
                      {m.contactNumber || "—"}
                      <div className="sub">{m.email || "No email added"}</div>
                    </td>
                    <td>
                      {m.jobStatus}
                      <div className="sub">
                        {m.studyStatus === "Student"
                          ? m.institution
                          : m.jobTitle}
                      </div>
                    </td>
                    <td>
                      <span className="badge">{m.immigrationStatus}</span>
                    </td>
                    <td>
                      <span className={`badge ${m.isActive ? "green" : ""}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/members/${m._id}`}
                        aria-label={`View ${m.fullName}`}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No members found"
            description="Try a different search or filter, or add your first member."
          />
        )}
        <div className="table-footer">
          <span>
            {filtered.length
              ? `${currentPage * 12 + 1}–${Math.min(currentPage * 12 + 12, filtered.length)} of ${filtered.length} members`
              : "0 members"}
          </span>
          <div className="flex gap-2">
            <button
              className="button small"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>
            <button
              className="button small"
              disabled={(currentPage + 1) * 12 >= filtered.length}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
const blankMember = (mandal: string): Omit<Member, "_id"> => ({
  fullName: "",
  dob: "",
  mandal,
  contactNumber: "",
  email: "",
  studyStatus: "Student",
  institution: "",
  courseName: "",
  yearOfStudy: "",
  jobStatus: "Student",
  employer: "",
  jobTitle: "",
  partTimeJob: false,
  partTimeJobDetails: { employer: "", hoursPerWeek: 0 },
  immigrationStatus: "Study Permit",
  indiaLocation: { state: "", city: "", village: "" },
  currentCanadaLocation: { city: "Windsor", province: "Ontario" },
  joinedDate: today(),
  isActive: true,
  notes: "",
});
export function MemberForm({
  data,
  member,
  onCancel,
}: {
  data: AppData;
  member?: Member;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<Omit<Member, "_id">>(() =>
    member
      ? {
          ...member,
          dob: member.dob?.slice(0, 10) || "",
          joinedDate: member.joinedDate.slice(0, 10),
        }
      : blankMember(data.mandals[0]?._id || ""),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mandals, setMandals] = useState(data.mandals);
  const [newMandal, setNewMandal] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const input = (
    key: keyof typeof form,
    label: string,
    type = "text",
    required = false,
  ) => (
    <Field label={label}>
      <input
        type={type}
        value={String(form[key] ?? "")}
        required={required}
        onChange={(e) => set(key, e.target.value as never)}
      />
    </Field>
  );
  if (data.role === "Viewer")
    return (
      <Empty
        title="View-only access"
        description="Only the administrator can add or edit member profiles."
      />
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
          const saved = await saveRecord("members", form, member?._id);
          fireToast(member ? "Member updated" : "Member added");
          router.push(`/members/${saved._id}`);
          router.refresh();
          onCancel?.();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <ErrorNotice message={error} />
      <div className="panel form-panel">
        <h2>Personal details</h2>
        <p className="subtitle">
          Start with the essentials. Fields marked * are required.
        </p>
        <div className="form-grid">
          {input("fullName", "Full name *", "text", true)}
          {input("dob", "Date of birth", "date")}
          <Field label="Mandal *">
            <select
              value={form.mandal}
              required
              onChange={(e) => set("mandal", e.target.value)}
            >
              <option value="">Select mandal</option>
              {mandals.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          {input("joinedDate", "Joined date *", "date", true)}
          {input("contactNumber", "Contact number", "tel")}
          {input("email", "Email address", "email")}
          <div className="span-2">
            <button
              className="link"
              type="button"
              onClick={() => setAdding(!adding)}
            >
              <Plus size={13} />
              Add a mandal
            </button>
            {adding && (
              <div className="flex gap-2 mt-3">
                <input
                  aria-label="New mandal name"
                  value={newMandal}
                  onChange={(e) => setNewMandal(e.target.value)}
                  placeholder="Mandal name"
                />
                <button
                  type="button"
                  className="button"
                  disabled={busy || !newMandal.trim()}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const m = await saveRecord("mandals", {
                        name: newMandal,
                      });
                      setMandals((ms) => [...ms, m]);
                      set("mandal", m._id);
                      setAdding(false);
                      setNewMandal("");
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Add mandal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="panel form-panel">
        <h2>Study & employment</h2>
        <p className="subtitle">
          Understand where each member is in their journey.
        </p>
        <div className="form-grid">
          <Field label="Study status">
            <select
              value={form.studyStatus}
              onChange={(e) =>
                set("studyStatus", e.target.value as Member["studyStatus"])
              }
            >
              {STUDY_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          {form.studyStatus === "Student" && (
            <>
              {input("institution", "Institution")}
              {input("courseName", "Course name")}
              {input("yearOfStudy", "Year of study")}
            </>
          )}
          <Field label="Job status">
            <select
              value={form.jobStatus}
              onChange={(e) =>
                set("jobStatus", e.target.value as Member["jobStatus"])
              }
            >
              {JOB_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          {["Full-Time", "Part-Time"].includes(form.jobStatus) && (
            <>
              {input("employer", "Employer")}
              {input("jobTitle", "Job title")}
            </>
          )}
          <label className="checkbox-label span-2">
            <input
              type="checkbox"
              checked={form.partTimeJob}
              onChange={(e) => set("partTimeJob", e.target.checked)}
            />
            Has an additional part-time job
          </label>
          {form.partTimeJob && (
            <>
              <Field label="Part-time employer">
                <input
                  value={form.partTimeJobDetails.employer}
                  onChange={(e) =>
                    set("partTimeJobDetails", {
                      ...form.partTimeJobDetails,
                      employer: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Hours per week">
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={form.partTimeJobDetails.hoursPerWeek}
                  onChange={(e) =>
                    set("partTimeJobDetails", {
                      ...form.partTimeJobDetails,
                      hoursPerWeek: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </>
          )}
        </div>
      </div>
      <div className="panel form-panel">
        <h2>Home & community</h2>
        <p className="subtitle">
          From our roots to the places we now call home.
        </p>
        <div className="form-grid">
          <Field label="Immigration status">
            <select
              value={form.immigrationStatus}
              onChange={(e) =>
                set(
                  "immigrationStatus",
                  e.target.value as Member["immigrationStatus"],
                )
              }
            >
              {IMMIGRATION_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <div />
          {(["state", "city", "village"] as const).map((k) => (
            <Field key={k} label={`India · ${k[0].toUpperCase() + k.slice(1)}`}>
              <input
                value={form.indiaLocation[k]}
                onChange={(e) =>
                  set("indiaLocation", {
                    ...form.indiaLocation,
                    [k]: e.target.value,
                  })
                }
              />
            </Field>
          ))}
          {(["city", "province"] as const).map((k) => (
            <Field
              key={k}
              label={`Canada · ${k[0].toUpperCase() + k.slice(1)}`}
            >
              <input
                value={form.currentCanadaLocation[k]}
                onChange={(e) =>
                  set("currentCanadaLocation", {
                    ...form.currentCanadaLocation,
                    [k]: e.target.value,
                  })
                }
              />
            </Field>
          ))}
          <Field label="Notes" wide>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything helpful for the team to know…"
            />
          </Field>
          <label className="checkbox-label span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            Active member
          </label>
        </div>
      </div>
      <ErrorNotice message={error} />
      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="button" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <Link href="/members" className="button">
            Cancel
          </Link>
        )}
        <button className="button primary" disabled={busy}>
          {busy ? "Saving…" : member ? "Save changes" : "Add member"}
        </button>
      </div>
    </form>
  );
}
export function MemberProfile({
  data,
  member,
}: {
  data: AppData;
  member: Member;
}) {
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  const history = data.sabhas
    .filter((s) => s.attendees.includes(member._id))
    .sort((a, b) => b.date.localeCompare(a.date));
  const mandal = data.mandals.find((m) => m._id === member.mandal)?.name;
  return (
    <>
      <Link href="/members" className="link mb-5">
        <ArrowLeft size={14} />
        Member directory
      </Link>
      <Heading
        title={edit ? "Edit member" : member.fullName}
        description={
          edit
            ? "Keep their community profile up to date."
            : `${mandal} mandal · Member since ${dateLabel(member.joinedDate)}`
        }
      >
        {!edit && data.role !== "Viewer" && (
          <div className="profile-actions">
            <DeleteButton
              collection="members"
              id={member._id}
              onDone={() => {
                router.push("/members");
                router.refresh();
              }}
            />
            <button className="button primary" onClick={() => setEdit(true)}>
              Edit profile
            </button>
          </div>
        )}
      </Heading>
      {edit ? (
        <MemberForm
          data={data}
          member={member}
          onCancel={() => setEdit(false)}
        />
      ) : (
        <div className="detail-grid">
          <div className="stack">
            <section className="panel form-panel mb-0">
              <div className="member-header">
                <span className="avatar">{initials(member.fullName)}</span>
                <div>
                  <h2>{member.fullName}</h2>
                  <div className="pill-list">
                    <span className={`badge ${member.isActive ? "green" : ""}`}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="badge">{member.immigrationStatus}</span>
                  </div>
                </div>
              </div>
              <dl className="detail-list">
                {[
                  ["Date of birth", member.dob ? dateLabel(member.dob) : "—"],
                  ["Email", member.email],
                  ["Phone", member.contactNumber],
                  ["Mandal", mandal],
                  [
                    "Canada",
                    [
                      member.currentCanadaLocation.city,
                      member.currentCanadaLocation.province,
                    ]
                      .filter(Boolean)
                      .join(", "),
                  ],
                  [
                    "India",
                    [
                      member.indiaLocation.village,
                      member.indiaLocation.city,
                      member.indiaLocation.state,
                    ]
                      .filter(Boolean)
                      .join(", "),
                  ],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="panel form-panel mb-0">
              <h2>Study & employment</h2>
              <dl className="detail-list">
                {[
                  ["Study status", member.studyStatus],
                  ["Job status", member.jobStatus],
                  ...(member.studyStatus === "Student"
                    ? [
                        ["Institution", member.institution],
                        [
                          "Course / year",
                          [member.courseName, member.yearOfStudy]
                            .filter(Boolean)
                            .join(" · "),
                        ],
                      ]
                    : []),
                  ...(["Full-Time", "Part-Time"].includes(member.jobStatus)
                    ? [
                        ["Employer", member.employer],
                        ["Job title", member.jobTitle],
                      ]
                    : []),
                  ...(member.partTimeJob
                    ? [
                        [
                          "Part-time job",
                          `${member.partTimeJobDetails.employer} · ${member.partTimeJobDetails.hoursPerWeek} hours/week`,
                        ],
                      ]
                    : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {member.notes && (
              <section className="panel form-panel">
                <h2>Notes</h2>
                <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">
                  {member.notes}
                </p>
              </section>
            )}
          </div>
          <section className="panel self-start">
            <div className="panel-head">
              <h2>Sabha attendance</h2>
              <span className="badge green">{history.length} attended</span>
            </div>
            <div className="panel-body">
              {history.length ? (
                history.map((s) => (
                  <Link
                    href={`/sabhas/${s._id}`}
                    key={s._id}
                    className="item-row"
                  >
                    <div className="grow">
                      <strong>{dateLabel(s.date)}</strong>
                      <p>
                        {data.mandals.find((m) => m._id === s.mandal)?.name}{" "}
                        sabha
                      </p>
                    </div>
                    <ChevronRight size={14} />
                  </Link>
                ))
              ) : (
                <Empty
                  title="No attendance yet"
                  description="Check this member in at their next sabha."
                />
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
