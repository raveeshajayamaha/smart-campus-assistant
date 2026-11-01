import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ClipboardList, LockKeyhole, Mail, ShieldCheck, UserRound, UserRoundPen } from "lucide-react";
import CampusLayout from "../components/CampusLayout";
import { api, storedUser, type CampusUser } from "../lib/api";
import "./Profile.css";
import ChangePasswordForm from "./ChangePasswordForm";

type ProfileUser = CampusUser & { year?: string | number; semester?: string | number; status?: string };
const editFields = [
  { key: "name", label: "Full Name", maxLength: 120 },
  { key: "studentId", label: "Student ID", maxLength: 60 },
  { key: "faculty", label: "Faculty", maxLength: 120 },
  { key: "department", label: "Department", maxLength: 120 },
  { key: "yearSemester", label: "Year/Semester", maxLength: 60 },
  { key: "contactNumber", label: "Contact Number", maxLength: 40 },
] as const;
type Draft = Record<typeof editFields[number]["key"], string>;

function display(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim()
    : typeof value === "number" && Number.isFinite(value) ? String(value) : "Not provided";
}

function displayDate(value: string | undefined): string {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not provided"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Colombo" });
}

function InformationFields({ fields }: { fields: [string, string][] }) {
  return <dl className="profile-fields">{fields.map(([label, value]) => <div className="profile-field" key={label}>
    <dt>{label}</dt><dd className={value === "Not provided" ? "profile-missing" : undefined}>{value}</dd>
  </div>)}</dl>;
}

export default function Profile() {
  const [user, setUser] = useState<ProfileUser | null>(storedUser);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: "", studentId: "", faculty: "", department: "", yearSemester: "", contactNumber: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const firstInput = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  useEffect(() => { if (editing) firstInput.current?.focus(); }, [editing]);
  const yearSemester = user?.yearSemester?.trim() || [user?.year != null && display(user.year) !== "Not provided" ? `Year ${display(user.year)}` : "",
    user?.semester != null && display(user.semester) !== "Not provided" ? `Semester ${display(user.semester)}` : ""].filter(Boolean).join(" / ") || "Not provided";
  const academicFields: [string, string][] = [
    ["Student ID", display(user?.studentId)], ["Faculty", display(user?.faculty)],
    ["Department", display(user?.department)], ["Year / Semester", yearSemester],
  ];
  const personalFields: [string, string][] = [
    ["Full Name", display(user?.name)], ["Email", display(user?.email)],
    ["Role", display(user?.role)], ...academicFields, ["Contact Number", display(user?.contactNumber)],
  ];
  const accountFields: [string, string][] = [
    ["Account Role", display(user?.role)], ["Account Status", display(user?.status)],
    ["Registered Date", displayDate(user?.createdAt)], ["Last Updated", displayDate(user?.updatedAt)],
  ];

  function startEditing() {
    setDraft({ name: user?.name || "", studentId: user?.studentId || "", faculty: user?.faculty || "",
      department: user?.department || "", yearSemester: user?.yearSemester || (yearSemester === "Not provided" ? "" : yearSemester), contactNumber: user?.contactNumber || "" });
    setErrors({}); setServerError(""); setSuccess(""); setEditing(true);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const validation: Partial<Record<keyof Draft, string>> = {};
    for (const { key, label, maxLength } of editFields) {
      const value = draft[key].trim();
      if (key === "name" && !value) validation[key] = "Full Name is required.";
      else if (value.length > maxLength) validation[key] = `${label} must be ${maxLength} characters or fewer.`;
      else if (Array.from(value).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) validation[key] = `${label} must not contain control characters.`;
      else if (key === "contactNumber" && value && (!/^[+0-9(). -]{3,40}$/.test(value) || !/\d/.test(value))) validation[key] = "Enter a valid contact number using digits and phone punctuation.";
    }
    setErrors(validation); setServerError(""); setSuccess("");
    if (Object.keys(validation).length) return;
    pending.current = true; setSaving(true);
    try {
      const data = await api("/auth/profile", { method: "PUT", body: JSON.stringify(draft) });
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user); setEditing(false); setSuccess("Profile updated successfully.");
    } catch (error) { setServerError(error instanceof Error ? error.message : "Unable to update your profile. Please try again."); }
    finally { pending.current = false; setSaving(false); }
  }

  return <CampusLayout title="My Profile" hero>
    <div className="student-profile">
      {success && <p className="profile-feedback profile-success" role="status">{success}</p>}
      <section className="profile-card profile-overview" aria-labelledby="profile-name">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true"><UserRound size={48} strokeWidth={1.6} /></div>
          <div className="profile-identity-text">
            <div className="profile-eyebrow">CAMPUS PROFILE</div>
            <h2 id="profile-name">{display(user?.name)}</h2>
            <p className="profile-email"><Mail size={16} aria-hidden="true" />{display(user?.email)}</p>
            <div className="profile-badges"><span className="profile-role"><ShieldCheck size={14} aria-hidden="true" />{display(user?.role)}</span>
              <span className="profile-session"><CheckCircle2 size={14} aria-hidden="true" />Signed in</span></div>
          </div>
        </div>
        <InformationFields fields={academicFields} />
      </section>

      <section className="profile-card" aria-labelledby="profile-personal-heading">
        <div className="profile-section-heading"><span className="profile-section-icon"><UserRound size={21} aria-hidden="true" /></span>
          <div><h2 id="profile-personal-heading">Personal Information</h2><p>Your personal and academic details.</p></div></div>
        {editing ? <form className="profile-edit-form" onSubmit={saveProfile} noValidate aria-busy={saving}>
          <div className="profile-edit-fields">
            {editFields.map(({ key, label, maxLength }, index) => <label key={key} htmlFor={`profile-edit-${key}`}>{label}{key === "name" && " (required)"}
              <input ref={index === 0 ? firstInput : undefined} id={`profile-edit-${key}`} name={key} type={key === "contactNumber" ? "tel" : "text"}
                autoComplete={key === "name" ? "name" : key === "contactNumber" ? "tel" : "off"} required={key === "name"} maxLength={maxLength}
                value={draft[key]} disabled={saving} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `profile-edit-${key}-error` : undefined}
                onChange={event => { setDraft(current => ({ ...current, [key]: event.target.value })); setErrors(current => ({ ...current, [key]: undefined })); }} />
              {errors[key] && <span className="profile-field-error" id={`profile-edit-${key}-error`} role="alert">{errors[key]}</span>}
            </label>)}
            <label htmlFor="profile-edit-email">Email (read-only)<input id="profile-edit-email" value={user?.email || ""} readOnly /></label>
            <label htmlFor="profile-edit-role">Role (read-only)<input id="profile-edit-role" value={user?.role || ""} readOnly /></label>
          </div>
          {serverError && <p className="profile-feedback profile-error" role="alert">{serverError}</p>}
          <div className="profile-edit-buttons"><button type="submit" disabled={saving}>{saving ? "Saving changes..." : "Save Changes"}</button>
            <button type="button" disabled={saving} onClick={() => { setEditing(false); setErrors({}); setServerError(""); }}>Cancel</button></div>
        </form> : <InformationFields fields={personalFields} />}
      </section>

      <section className="profile-card" aria-labelledby="profile-account-heading">
        <div className="profile-section-heading"><span className="profile-section-icon"><ShieldCheck size={21} aria-hidden="true" /></span>
          <div><h2 id="profile-account-heading">Account Information</h2><p>Your campus account details.</p></div></div>
        <InformationFields fields={accountFields} />
      </section>

      <section className="profile-card" aria-labelledby="profile-actions-heading">
        <div className="profile-section-heading"><span className="profile-section-icon"><ClipboardList size={21} aria-hidden="true" /></span>
          <div><h2 id="profile-actions-heading">Quick Actions</h2><p>Manage your profile and access academic information.</p></div></div>
        <div className="profile-actions">
          <button className="profile-action" type="button" onClick={startEditing} disabled={editing || saving || changingPassword}><UserRoundPen size={22} aria-hidden="true" /><span>Edit Profile<small>Update your details</small></span></button>
          <button className="profile-action" type="button" disabled={editing || saving || changingPassword} onClick={() => setChangingPassword(true)}><LockKeyhole size={22} aria-hidden="true" /><span>Change Password<small>Update your password</small></span></button>
          <Link className="profile-action" to="/academic"><BookOpen size={22} aria-hidden="true" /><span>View Academic Info<small>Academic information</small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>
          <Link className="profile-action" to="/academic"><CalendarDays size={22} aria-hidden="true" /><span>View Schedule<small>Classes and timetable</small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <p className="profile-help">You can update your personal details here. Contact the faculty office for email or role changes.</p>
      </section>
      {changingPassword && <ChangePasswordForm onCancel={() => setChangingPassword(false)} />}
    </div>
  </CampusLayout>;
}
