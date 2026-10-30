import { useState } from "react";
import CampusLayout from "../components/CampusLayout";
import { useRecords } from "../lib/useRecords";
import { storedUser } from "../lib/api";
const config = {
  events: { title: "Campus Events", path: "/events", key: "events", fields: ["description", "date", "time", "location", "category"] },
  academic: { title: "Academic Information / My Schedule", path: "/schedules", key: "schedules", fields: ["date", "startTime", "endTime", "location", "type"] },
  library: { title: "Library Resources", path: "/library", key: "resources", fields: ["type", "description", "availability", "location"] },
  locations: { title: "Campus Map / Locations", path: "/locations", key: "locations", fields: ["building", "description", "category", "openingHours", "directions"] },
  announcements: { title: "Announcements", path: "/announcements", key: "announcements", fields: ["description", "category", "date", "priority"] }
};
export default function CampusPage({ section }: { section: keyof typeof config }) {
  const c = config[section];
  const { records, loading, error } = useRecords(c.path, c.key);
  const [search, setSearch] = useState("");
  const visible = records.filter(r => Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase()));
  return <CampusLayout title={c.title}><label className="campus-search-field">Search {c.title}<input className="campus-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, subject, category or location" /></label>
    {loading ? <p role="status">Loading...</p> : error ? <p role="alert">{error} <button onClick={() => window.location.reload()}>Retry</button></p> : !visible.length ? <p role="status">No matching records available.</p> : <div className="campus-grid">{visible.map(r => <article className="campus-card" key={r._id}>
      <h2>{r.title || r.subject || r.name}</h2>
      {c.fields.map(field => <p key={field}><strong>{field.replace(/([A-Z])/g, " $1")}: </strong>{field === "date" ? new Date(r[field]).toLocaleDateString("en-GB", { timeZone: "UTC" }) : r[field]}</p>)}
      {r.link && /^https?:\/\//i.test(r.link) && <a href={r.link} target="_blank" rel="noreferrer">Open resource</a>}
    </article>)}</div>}
  </CampusLayout>;
}
export function Profile() {
  const user = storedUser();
  return <CampusLayout title="My Profile"><article className="campus-card"><h2>{user?.name}</h2><p>Email: {user?.email}</p><p>Role: {user?.role}</p><p>Contact the faculty office to update your campus account details.</p></article></CampusLayout>;
}
