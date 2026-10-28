import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ChevronRight, GraduationCap, LayoutDashboard, Library, LoaderCircle, LogOut, MapPin, Megaphone, Menu, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { api, logout, storedUser, type CampusRecord } from "../lib/api";
import "./AdminDashboard.css";

type SectionKey = "events" | "announcements" | "schedules" | "library" | "locations";
type Field = { name: string; label: string; type?: string; optional?: boolean; placeholder?: string };
type Column = { label: string; fields: string[] };
type Section = { key: string; label: string; singular: string; countLabel: string; description: string; icon: LucideIcon; accent: string; fields: Field[]; columns: Column[] };
const field = (name: string, label: string, options: Omit<Field, "name" | "label"> = {}): Field => ({ name, label, ...options });
const sections: Record<SectionKey, Section> = {
  events: {
    key: "events", label: "Events", singular: "Event", countLabel: "Total events", icon: CalendarDays, accent: "blue",
    description: "Keep the campus connected with workshops, activities and events.",
    fields: [field("title", "Event title"), field("description", "Description", { type: "textarea" }), field("date", "Date", { type: "date" }), field("time", "Time", { placeholder: "10:00 AM - 12:00 PM" }), field("location", "Location"), field("category", "Category"), field("image", "Image path or URL", { optional: true, placeholder: "/images/event1.png" })],
    columns: [{ label: "Event", fields: ["title"] }, { label: "Date", fields: ["date"] }, { label: "Time", fields: ["time"] }, { label: "Location", fields: ["location"] }, { label: "Category", fields: ["category"] }],
  },
  announcements: {
    key: "announcements", label: "Announcements", singular: "Announcement", countLabel: "Total announcements", icon: Megaphone, accent: "violet",
    description: "Share timely updates and important notices with students.",
    fields: [field("title", "Announcement title"), field("description", "Description", { type: "textarea" }), field("category", "Category"), field("date", "Date", { type: "date" }), field("priority", "Priority", { type: "priority" })],
    columns: [{ label: "Announcement", fields: ["title"] }, { label: "Category", fields: ["category"] }, { label: "Priority", fields: ["priority"] }, { label: "Date", fields: ["date"] }],
  },
  schedules: {
    key: "schedules", label: "Academic Schedules", singular: "Schedule", countLabel: "Schedule entries", icon: BookOpen, accent: "amber",
    description: "Organize lectures, practical sessions and academic activities.",
    fields: [field("subject", "Subject"), field("date", "Date", { type: "date" }), field("startTime", "Start time", { type: "time" }), field("endTime", "End time", { type: "time" }), field("location", "Location"), field("type", "Session type", { placeholder: "Lecture, Lab or Exam" })],
    columns: [{ label: "Subject", fields: ["subject"] }, { label: "Date", fields: ["date"] }, { label: "Time", fields: ["startTime", "endTime"] }, { label: "Location", fields: ["location"] }, { label: "Type", fields: ["type"] }],
  },
  library: {
    key: "resources", label: "Library Resources", singular: "Resource", countLabel: "Library resources", icon: Library, accent: "teal",
    description: "Maintain a useful collection of books, study spaces and digital resources.",
    fields: [field("title", "Resource title"), field("type", "Resource type"), field("description", "Description", { type: "textarea" }), field("availability", "Availability", { placeholder: "Available, Online or 5 copies available" }), field("location", "Location"), field("link", "Resource link", { type: "url", optional: true, placeholder: "https://" })],
    columns: [{ label: "Resource", fields: ["title"] }, { label: "Type", fields: ["type"] }, { label: "Availability", fields: ["availability"] }, { label: "Location", fields: ["location"] }],
  },
  locations: {
    key: "locations", label: "Campus Locations", singular: "Location", countLabel: "Campus locations", icon: MapPin, accent: "rose",
    description: "Help students find campus buildings, facilities and services.",
    fields: [field("name", "Location name"), field("building", "Building"), field("description", "Description", { type: "textarea" }), field("category", "Category"), field("openingHours", "Opening hours", { placeholder: "Monday-Friday 08:00-17:00" }), field("directions", "Directions", { type: "textarea" })],
    columns: [{ label: "Location", fields: ["name"] }, { label: "Building", fields: ["building"] }, { label: "Category", fields: ["category"] }, { label: "Opening hours", fields: ["openingHours"] }],
  },
};
const sectionKeys = Object.keys(sections) as SectionKey[];
type Collection = { records: CampusRecord[]; error: string };
const emptyCollections = (): Record<SectionKey, Collection> => ({
  events: { records: [], error: "" }, announcements: { records: [], error: "" },
  schedules: { records: [], error: "" }, library: { records: [], error: "" },
  locations: { records: [], error: "" },
});
const recordName = (record: CampusRecord) => record.title || record.subject || record.name;
const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;
function displayValue(record: CampusRecord, name: string) {
  if (!record[name]) return "Not specified";
  return name === "date" ? new Date(record[name]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : record[name];
}

export default function AdminDashboard() {
  const [section, setSection] = useState<SectionKey | "overview">("overview");
  const [collections, setCollections] = useState(emptyCollections);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const user = storedUser();
  const c = section === "overview" ? null : sections[section];
  const current = section === "overview" ? null : collections[section];
  const records = current?.records || [];
  const visible = records.filter(record => Object.values(record).join(" ").toLowerCase().includes(search.toLowerCase()));
  const urgentCount = collections.announcements.records.filter(record => ["urgent", "high"].includes(record.priority)).length;

  useEffect(() => {
    let active = true;
    // Each response supplies both the overview count and its management table.
    Promise.allSettled(sectionKeys.map(key => api(`/${key}`))).then(results => {
      if (!active) return;
      setCollections(Object.fromEntries(results.map((result, i) => {
        const key = sectionKeys[i];
        return [key, result.status === "fulfilled"
          ? { records: result.value[sections[key].key] as CampusRecord[], error: "" }
          : { records: [], error: message(result.reason, "Unable to load records") }];
      })) as Record<SectionKey, Collection>);
      setLoading(false);
    });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    if (formOpen) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      formRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
    }
  }, [formOpen, editing]);

  function changeSection(next: SectionKey | "overview") {
    if (busy) return;
    setSection(next); setValues({}); setEditing(""); setFormOpen(false);
    setError(""); setFormError(""); setNotice(""); setSearch(""); setSidebarOpen(false);
  }
  function closeForm() {
    if (busy) return;
    setValues({}); setEditing(""); setFormError(""); setFormOpen(false); addRef.current?.focus();
  }
  function addRecord(key?: SectionKey) {
    if (key) changeSection(key);
    setValues({}); setEditing(""); setFormError(""); setNotice(""); setFormOpen(true);
  }
  function editRecord(record: CampusRecord) {
    if (!c) return;
    setEditing(record._id);
    setValues(Object.fromEntries(c.fields.map(f => [f.name, f.type === "date" ? record[f.name]?.slice(0, 10) || "" : record[f.name] || ""])));
    setFormError(""); setNotice(""); setFormOpen(true);
  }
  function reload() { setError(""); setLoading(true); setRevision(r => r + 1); }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!c || section === "overview" || busy) return;
    const missing = c.fields.find(f => !f.optional && f.type !== "priority" && !values[f.name]?.trim());
    if (missing) { setFormError(`${missing.label} is required.`); return; }
    if (section === "schedules" && values.endTime <= values.startTime) { setFormError("End time must be after start time."); return; }
    setBusy(true); setError(""); setFormError(""); setNotice("");
    try {
      await api(`/${section}${editing ? "/" + editing : ""}`, { method: editing ? "PUT" : "POST", body: JSON.stringify(values) });
      setValues({}); setEditing(""); setFormOpen(false);
      setNotice(`${c.singular} ${editing ? "updated" : "added"} successfully.`);
      setLoading(true); setRevision(r => r + 1); addRef.current?.focus();
    } catch (error) { setFormError(message(error, "Save failed. Please try again.")); }
    finally { setBusy(false); }
  }
  async function remove(record: CampusRecord) {
    if (!c || section === "overview" || busy || !window.confirm(`Delete "${recordName(record)}"? This cannot be undone.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api(`/${section}/${record._id}`, { method: "DELETE" });
      setCollections(previous => ({ ...previous, [section]: { ...previous[section], records: previous[section].records.filter(x => x._id !== record._id) } }));
      if (editing === record._id) { setEditing(""); setValues({}); setFormOpen(false); }
      setNotice(`${c.singular} deleted successfully.`);
    } catch (error) { setError(message(error, "Delete failed. Please try again.")); }
    finally { setBusy(false); }
  }

  return (
    <div className="admin-page">
      {sidebarOpen && <button className="admin-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside id="admin-sidebar" className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <button className="admin-brand" onClick={() => changeSection("overview")} disabled={busy} aria-label="Smart Campus Assistant dashboard"><span className="admin-brand-icon"><GraduationCap size={27} /></span><span>Smart Campus<small>Assistant</small></span></button>
        <span className="admin-portal-label"><ShieldCheck size={13} /> ADMIN PORTAL</span>
        <nav className="admin-navigation" aria-label="Administration">
          <p className="admin-nav-heading">WORKSPACE</p>
          <button className={`admin-nav-item${section === "overview" ? " is-active" : ""}`} data-section="overview" aria-current={section === "overview" ? "page" : undefined} onClick={() => changeSection("overview")} disabled={busy}><LayoutDashboard size={19} /><span>Dashboard</span>{section === "overview" && <ChevronRight size={15} />}</button>
          <p className="admin-nav-heading">CONTENT MANAGEMENT</p>
          {sectionKeys.map(key => { const item = sections[key]; const Icon = item.icon; return <button key={key} data-section={key} className={`admin-nav-item${section === key ? " is-active" : ""}`} aria-current={section === key ? "page" : undefined} onClick={() => changeSection(key)} disabled={busy}><Icon size={19} /><span>{item.label}</span><small>{loading ? "..." : collections[key].error ? "!" : collections[key].records.length}</small></button>; })}
        </nav>
        <div className="admin-sidebar-bottom"><Link className="admin-student-link" to="/student-dashboard">Open student dashboard <ArrowRight size={15} /></Link><div className="admin-sidebar-account"><span className="admin-account-icon"><ShieldCheck size={20} /></span><div><strong>{user?.name || "Administrator"}</strong><small>Administrator</small></div></div><button className="admin-logout" onClick={() => void logout()} disabled={busy}><LogOut size={18} />Logout</button></div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-title"><button className="admin-icon-button admin-menu-toggle" aria-label="Toggle navigation" aria-expanded={sidebarOpen} aria-controls="admin-sidebar" onClick={() => setSidebarOpen(open => !open)}><Menu size={21} /></button><div><span>Administration <ChevronRight size={12} /> {c?.label || "Overview"}</span><h1>{c?.label || "Admin Dashboard"}</h1></div></div>
          <div className="admin-topbar-actions"><label className="admin-search"><Search size={17} /><input type="search" aria-label={c ? `Search ${c.label}` : "Search management sections"} placeholder={c ? `Search ${c.label.toLowerCase()}...` : "Find a management section..."} value={search} onChange={e => setSearch(e.target.value)} /></label><button className="admin-icon-button admin-notifications" aria-label={`View announcements${urgentCount ? `, ${urgentCount} high-priority notices` : ""}`} title="View announcements" disabled={busy} onClick={() => changeSection("announcements")}><Bell size={20} />{urgentCount > 0 && <span />}</button><span className="admin-topbar-divider" /><div className="admin-topbar-account"><span className="admin-avatar"><ShieldCheck size={21} /></span><div><strong>Admin</strong><small>Campus management</small></div></div></div>
        </header>
        <main className="admin-main">
          {notice && <div className="admin-feedback admin-feedback-success" role="status"><CheckCircle2 size={18} />{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={16} /></button></div>}
          {error && <div className="admin-feedback admin-feedback-error" role="alert"><TriangleAlert size={18} />{error}<button aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button></div>}
          {section === "overview" ? <>
            <section className="admin-welcome"><div><span className="admin-eyebrow">CAMPUS ADMINISTRATION</span><h2>A connected campus starts here.</h2><p>Welcome back, {user?.name || "Admin"}. Keep campus information organized,<br className="admin-desktop-break" /> up to date, and ready for your students.</p><button className="admin-primary-button" disabled={busy || loading || !!collections.events.error} onClick={() => addRecord("events")}><Plus size={17} />Add Event</button></div><div className="admin-welcome-art" aria-hidden="true"><span className="admin-art-orbit" /><GraduationCap size={76} strokeWidth={1.2} /><span className="admin-art-check"><CheckCircle2 size={25} /></span></div></section>
            <div className="admin-section-heading"><div><h2>Campus at a glance</h2><p>A live overview of the information you manage.</p></div><button className="admin-text-button" onClick={reload} disabled={loading || busy}><RefreshCw size={15} className={loading ? "admin-spin" : ""} />Refresh data</button></div>
            <section className="admin-stat-grid" aria-label="Campus statistics" aria-busy={loading}>{sectionKeys.map(key => { const item = sections[key]; const Icon = item.icon; return <button key={key} className={`admin-stat-card admin-accent-${item.accent}`} data-stat={key} disabled={busy} onClick={() => changeSection(key)}><div><span className="admin-stat-icon"><Icon size={21} /></span><ArrowRight size={16} className="admin-stat-arrow" /></div><strong>{loading ? <span className="admin-skeleton" /> : collections[key].error ? <span title={collections[key].error}>Unavailable</span> : collections[key].records.length}</strong><span>{item.countLabel}</span><small>View and manage <ArrowRight size={12} /></small></button>; })}</section>
            <div className="admin-section-heading"><div><h2>Manage campus content</h2><p>Everything your students need, in one place.</p></div><span className="admin-section-counter">5 content sections</span></div>
            <div className="admin-management-grid">{sectionKeys.filter(key => `${sections[key].label} ${sections[key].description}`.toLowerCase().includes(search.toLowerCase())).map(key => { const item = sections[key]; const Icon = item.icon; const collection = collections[key]; return <section className={`admin-management-card admin-accent-${item.accent}`} key={key}><div className="admin-management-card-header"><span className="admin-stat-icon"><Icon size={20} /></span><button className="admin-text-button" onClick={() => changeSection(key)} disabled={busy} aria-label={`Manage ${item.label}`}>Manage <ArrowRight size={14} /></button></div><h3>{item.label}</h3><p>{item.description}</p><div className="admin-card-footer">{loading ? "Loading records..." : collection.error ? <span className="admin-inline-error">Unable to load this section</span> : <><strong>{collection.records.length}</strong> {collection.records.length === 1 ? "record" : "records"} available</>}<button className="admin-mini-add" aria-label={`Add ${item.singular}`} disabled={busy || loading || !!collection.error} onClick={() => addRecord(key)}><Plus size={17} /></button></div></section>; })}
              {!sectionKeys.some(key => `${sections[key].label} ${sections[key].description}`.toLowerCase().includes(search.toLowerCase())) && <div className="admin-empty"><Search size={28} /><h3>No matching sections</h3><p>Try events, schedules, library or locations.</p><button className="admin-text-button" onClick={() => setSearch("")}>Clear search</button></div>}
            </div>
            {sectionKeys.some(key => collections[key].error) && <div className="admin-feedback admin-feedback-error" role="alert"><TriangleAlert size={18} />Some sections could not be loaded. Counts are shown only for available data.<button onClick={reload} disabled={loading}>Retry</button></div>}
            <div className="admin-overview-note"><ShieldCheck size={18} /><span>Changes are saved to your campus database and reflected on student pages.</span></div>
          </> : c && current && <>
            <div className="admin-section-heading admin-management-heading"><div><span className="admin-eyebrow">CONTENT MANAGEMENT</span><h2>Manage {c.label.toLowerCase()}</h2><p>{c.description}</p></div><button ref={addRef} className="admin-primary-button" disabled={busy || loading || !!current.error} onClick={() => addRecord()}><Plus size={17} />Add {c.singular}</button></div>
            {formOpen && <section className="admin-form-panel" ref={formRef} aria-labelledby="admin-form-title" onKeyDown={e => { if (e.key === "Escape") closeForm(); }}><div className="admin-form-header"><div><h3 id="admin-form-title">{editing ? "Edit" : "Add"} {c.singular.toLowerCase()}</h3><p>Fields marked <span aria-hidden="true">*</span> are required.</p></div><button className="admin-icon-button" type="button" aria-label="Close form" disabled={busy} onClick={closeForm}><X size={19} /></button></div>
              <form onSubmit={save} aria-busy={busy} aria-describedby={formError ? "admin-form-error" : undefined}><fieldset disabled={busy}><div className="admin-form-grid">{c.fields.map(f => <label key={f.name} className={f.type === "textarea" ? "admin-field-wide" : ""} htmlFor={`admin-${f.name}`}><span>{f.label}{!f.optional && <span className="admin-required"> *</span>}{f.optional && <small> (optional)</small>}</span>
                {f.type === "priority" ? <select id={`admin-${f.name}`} value={values[f.name] || "normal"} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select> : f.type === "textarea" ? <textarea id={`admin-${f.name}`} required={!f.optional} rows={3} value={values[f.name] || ""} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`} /> : <input id={`admin-${f.name}`} type={f.type || "text"} required={!f.optional} value={values[f.name] || ""} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))} placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`} />}
              </label>)}</div></fieldset>
                {formError && <div id="admin-form-error" className="admin-feedback admin-feedback-error" role="alert"><TriangleAlert size={17} />{formError}</div>}
                <div className="admin-form-footer"><span><ShieldCheck size={14} />Visible on student pages after saving</span><div><button className="admin-secondary-button" type="button" disabled={busy} onClick={closeForm}>Cancel</button><button className="admin-primary-button" type="submit" disabled={busy || loading}>{busy ? <><LoaderCircle size={16} className="admin-spin" />Saving...</> : <><CheckCircle2 size={16} />{editing ? "Update" : "Save"} {c.singular}</>}</button></div></div>
              </form>
            </section>}
            <section className="admin-records-panel" aria-busy={loading}><div className="admin-table-heading"><div><h3>All {c.label.toLowerCase()}</h3><span className="admin-count-badge">{loading ? "..." : current.error ? "Unavailable" : records.length}</span></div><button className="admin-text-button" disabled={loading || busy} onClick={reload}><RefreshCw size={14} className={loading ? "admin-spin" : ""} />Refresh</button></div>
              {loading ? <div className="admin-empty" role="status"><LoaderCircle size={30} className="admin-spin" /><h3>Loading {c.label.toLowerCase()}...</h3><p>Getting the latest campus information.</p></div> : current.error ? <div className="admin-empty admin-load-error" role="alert"><TriangleAlert size={30} /><h3>We could not load these records</h3><p>{current.error}</p><button className="admin-secondary-button" onClick={reload}>Try again</button></div> : !visible.length ? <div className="admin-empty" role="status"><c.icon size={32} /><h3>{search ? "No matching records" : `No ${c.label.toLowerCase()} yet`}</h3><p>{search ? "Try another search term or clear your search." : `Add your first ${c.singular.toLowerCase()} to get started.`}</p><button className="admin-secondary-button" disabled={busy} onClick={() => search ? setSearch("") : addRecord()}>{search ? "Clear search" : `Add ${c.singular}`}</button></div> : <><div className="admin-table-scroll" tabIndex={0} role="region" aria-label={`${c.label} table, scroll horizontally on smaller screens`}><table className="admin-table"><thead><tr>{c.columns.map(column => <th scope="col" key={column.label}>{column.label}</th>)}<th scope="col" className="admin-action-heading">Actions</th></tr></thead><tbody>{visible.map(record => <tr key={record._id}>{c.columns.map((column, index) => <td key={column.label} className={index === 0 ? "admin-record-name" : ""}>{column.fields[0] === "priority" ? <span className={`admin-priority admin-priority-${["normal", "high", "urgent"].includes(record.priority) ? record.priority : "normal"}`}>{record.priority}</span> : column.fields.map(name => displayValue(record, name)).join(" - ")}</td>)}<td><div className="admin-row-actions"><button className="admin-edit-button" disabled={busy} onClick={() => editRecord(record)} aria-label={`Edit ${recordName(record)}`}><Pencil size={14} /><span>Edit</span></button><button className="admin-delete-button" disabled={busy} onClick={() => void remove(record)} aria-label={`Delete ${recordName(record)}`}><Trash2 size={14} /><span>Delete</span></button></div></td></tr>)}</tbody></table></div><div className="admin-table-footer"><span>Showing <strong>{visible.length}</strong> of <strong>{records.length}</strong> {records.length === 1 ? "record" : "records"}</span><span><span className="admin-connected-dot" /> Shared with students</span></div></>}
            </section>
          </>}
          <footer className="admin-footer"><span>Smart Campus Assistant</span><span>Administration workspace</span></footer>
        </main>
      </div>
    </div>
  );
}
