import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { Home, MessageCircle, CalendarDays, BookOpen, Library, MapPin, User, LogOut, Shield } from "lucide-react";
import { logout, storedUser } from "../lib/api";
import "../pages/StudentDashboard.css";
import "../pages/CampusPages.css";
const links = [
  ["/student-dashboard", "Dashboard", Home], ["/assistant", "AI Assistant", MessageCircle],
  ["/events", "Events", CalendarDays], ["/academic", "Academic Info", BookOpen],
  ["/library", "Library", Library], ["/locations", "Campus Map", MapPin], ["/profile", "Profile", User]
] as const;
export default function CampusLayout({ title, children }: { title: string; children: ReactNode }) {
  const user = storedUser();
  return <div className="dashboard-page"><aside className="dashboard-sidebar">
    <div className="sidebar-logo">Smart Campus<span>Assistant</span></div>
    <div className="sidebar-user"><div className="default-user-icon"><User size={46} /></div><div className="student-role">{user?.name || "Student"}</div></div>
    <nav className="sidebar-menu">{links.map(([path, label, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}><Icon size={22} />{label}</NavLink>)}
    {user?.role === "admin" && <NavLink to="/admin-dashboard" className="sidebar-link"><Shield size={22} />Admin</NavLink>}</nav>
    <button className="logout-button campus-logout" onClick={() => void logout()}><LogOut size={22} />Logout</button>
  </aside><main className="dashboard-main"><div className="section-title-row"><h1>{title}</h1></div>{children}</main></div>;
}
