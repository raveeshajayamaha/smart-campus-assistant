import { useNavigate } from "react-router-dom";
import { api, logout, storedUser } from "../lib/api";
import { useRecords } from "../lib/useRecords";
import "./CampusPages.css";
import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  User,
  Home,
  MessageCircle,
  CalendarDays,
  BookOpen,
  MapPin,
  LogOut,
  GraduationCap,
  Bot,
  ArrowRight,
  Clock,
  Megaphone,
  Library,
} from "lucide-react";

import "./StudentDashboard.css";

type CampusEvent = {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  category: string;
};

function StudentDashboard() {
  const navigate = useNavigate();
  const announcements = useRecords("/announcements", "announcements");
  const schedules = useRecords("/schedules", "schedules");
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let active = true;

    async function loadEvents() {
      try {
        const data = await api("/events", { signal: controller.signal });
        if (!data.success || !Array.isArray(data.events)) {
          throw new Error("Failed to load events");
        }
        if (active) setEvents(data.events);
      } catch {
        if (active) setError("Unable to load events. Please refresh the page to try again.");
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    void loadEvents();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <div className="dashboard-page">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">

        <div className="sidebar-logo">
          Smart Campus
          <span>Assistant</span>
        </div>

        <div className="sidebar-user">

          <div className="default-user-icon">
            <User size={46} />
          </div>

          <div className="student-role">
            Student
          </div>

        </div>


        <nav className="sidebar-menu">
{storedUser()?.role === "admin" && <a className="sidebar-link" href="/admin-dashboard">Admin Dashboard</a>}

          <a className="sidebar-link active" href="/student-dashboard">
            <Home size={22} />
            Dashboard
          </a>

          <a className="sidebar-link" href="/assistant">
            <MessageCircle size={22} />
            AI Assistant
          </a>

          <a className="sidebar-link" href="/events">
            <CalendarDays size={22} />
            Events
          </a>

          <a className="sidebar-link" href="/academic">
            <BookOpen size={22} />
            Academic Info
          </a>

          <a className="sidebar-link" href="/library">
            <Library size={22} />
            Library
          </a>

          <a className="sidebar-link" href="/locations">
            <MapPin size={22} />
            Campus Map
          </a>

          <a className="sidebar-link" href="/profile">
            <User size={22} />
            Profile
          </a>

        </nav>

        <a className="logout-button" href="/login" onClick={e => { e.preventDefault(); void logout(); }}>
          <LogOut size={22} />
          Logout
        </a>

      </aside>


      {/* MAIN */}
      <main className="dashboard-main">

        {/* TOP BAR */}
        <div className="dashboard-topbar">

          <div className="dashboard-search">

            <Search size={21} />

            <input
              type="text"
              placeholder="Search events, services, or ask AI..."
              onKeyDown={e => { if (e.key === "Enter" && e.currentTarget.value.trim()) navigate("/assistant", { state: { question: e.currentTarget.value.trim() } }); }}
            />

          </div>

          <div className="dashboard-top-actions">

            <div className="notification-icon">
              <Bell size={23} />
              <span>{announcements.records.length}</span>
            </div>

            <div className="top-user-icon">
              <User size={25} />
            </div>

          </div>

        </div>


        {/* HERO */}
        <section className="dashboard-hero">

          <div className="dashboard-hero-overlay"></div>

          <div className="dashboard-hero-content">

            <h1>
              Welcome Back,
              <br />
              <span>{storedUser()?.name || "Student"}!</span>
            </h1>

            <p>
              Here's what's happening on your campus today.
            </p>

            <div className="dashboard-summary">

              <div className="summary-box">
                <strong>Week 3</strong>
                <span>Semester</span>
              </div>

              <div className="summary-box">
                <strong>{loading ? "..." : error ? "?" : events.length}</strong>
                <span>Upcoming Events</span>
              </div>

              <div className="summary-box">
                <strong>{announcements.loading ? "..." : announcements.records.length}</strong>
                <span>New Notifications</span>
              </div>

            </div>

          </div>

          <div className="hero-quote">
            “Learn Today,
            <br />
            Build a Better Tomorrow”
          </div>

        </section>


        {/* CONTENT GRID */}
        <div className="dashboard-grid">

          {/* LEFT COLUMN */}
          <div className="dashboard-left-column">

            {/* QUICK ACTIONS */}
            <section className="dashboard-section">

              <div className="section-title-row">
                <h2>Quick Actions</h2>
                <a href="/academic">
                  View All <ArrowRight size={16} />
                </a>
              </div>

              <div className="quick-actions-grid">

                <QuickAction
                  className="academic-card"
                  icon={<GraduationCap />}
                  title="Academic Information"
                />

                <QuickAction
                  className="event-card-action"
                  icon={<CalendarDays />}
                  title="Upcoming Events"
                />

                <QuickAction
                  className="library-card"
                  icon={<BookOpen />}
                  title="Library Resources"
                />

                <QuickAction
                  className="map-card"
                  icon={<MapPin />}
                  title="Campus Map"
                />

                <QuickAction
                  className="ai-card"
                  icon={<Bot />}
                  title="AI Assistant"
                />

              </div>

            </section>


            {/* UPCOMING EVENTS */}
            <section
              className="dashboard-section"
              id="events"
            >

              <div className="section-title-row">

                <h2>Upcoming Events</h2>

                <a href="/events">
                  View All <ArrowRight size={16} />
                </a>

              </div>


              <div className="dashboard-events">

                {loading ? (
                  <p role="status">Loading events...</p>
                ) : error ? (
                  <p role="alert">{error}</p>
                ) : events.length === 0 ? (
                  <p role="status">No events available yet.</p>
                ) : (
                  events.map((event) => (
                    <DashboardEvent
                      key={event._id}
                      image={event.image || "/images/event1.png"}
                      date={event.date}
                      title={event.title}
                      time={event.time}
                      location={event.location}
                      description={event.description}
                    />
                  ))
                )}

              </div>

            </section>

          </div>


          {/* RIGHT COLUMN */}
          <div className="dashboard-right-column">

            {/* SCHEDULE */}
            <section className="dashboard-section schedule-section">

              <div className="section-title-row">

                <h2>My Schedule</h2>

                <a href="/academic">
                  View All <ArrowRight size={16} />
                </a>

              </div>


              {schedules.loading ? <p role="status">Loading schedule...</p> : schedules.error ? <p role="alert">{schedules.error}</p> : schedules.records.length === 0 ? <p>No schedule entries available.</p> : schedules.records.map((entry, i) => <ScheduleItem key={entry._id} date={entry.date} title={entry.subject} time={`${entry.startTime} - ${entry.endTime}`} location={entry.location} type={["blue", "green", "orange"][i % 3]} />)}

            </section>


            {/* ANNOUNCEMENTS */}
            <section className="dashboard-section announcements-section">

              <div className="section-title-row">

                <h2>Announcements</h2>

                <a href="/announcements">
                  View All <ArrowRight size={16} />
                </a>

              </div>


              {announcements.loading ? <p role="status">Loading announcements...</p> : announcements.error ? <p role="alert">{announcements.error}</p> : announcements.records.length === 0 ? <p>No announcements available.</p> : announcements.records.map(entry => <Announcement key={entry._id} icon={<Megaphone />} title={`${entry.title}${entry.priority !== "normal" ? " (" + entry.priority + ")" : ""}`} description={entry.description} />)}

            </section>

          </div>

        </div>

      </main>

    </div>
  );
}


function QuickAction({
  icon,
  title,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  className: string;
}) {
  const targets: Record<string, string> = { "academic-card": "/academic", "event-card-action": "/events", "library-card": "/library", "map-card": "/locations", "ai-card": "/assistant" };
  const go = () => window.location.assign(targets[className]);
  return (
    <div className={`quick-action-card ${className}`} role="link" tabIndex={0} onClick={go} onKeyDown={e => { if (e.key === "Enter") go(); }}>

      <div className="quick-action-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <ArrowRight className="quick-arrow" />

    </div>
  );
}


function DashboardEvent({
  description,
  image,
  date,
  title,
  time,
  location,
}: {
  description: string;
  image: string;
  date: string;
  title: string;
  time: string;
  location: string;
}) {
  return (
    <div className="dashboard-event-card">

      <div
        className="dashboard-event-image"
        style={{
          backgroundImage: `url(${image})`,
        }}
      >

        <div className="dashboard-event-date">
          <small>{new Date(date).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase()}</small>
          <strong>{new Date(date).toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" })}</strong>
        </div>

      </div>

      <div className="dashboard-event-info">

        <h3>{title}</h3>

        <p>
          <Clock size={15} />
          {time}
        </p>

        <p>
          <MapPin size={15} />
          {location}
        </p>

        <button onClick={() => window.alert(`${title}\n${description}\n${time} - ${location}`)}>
          View Details
          <ArrowRight size={15} />
        </button>

      </div>

    </div>
  );
}


function ScheduleItem({
  date,
  title,
  time,
  location,
  type,
}: {
  date: string;
  title: string;
  time: string;
  location: string;
  type: string;
}) {
  return (
    <div className="schedule-item">

      <div className="schedule-date">

        <small>{new Date(date).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase()}</small>

        <strong>{new Date(date).toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" })}</strong>

      </div>

      <div className={`schedule-line ${type}`}></div>

      <div className="schedule-info">

        <h3>{title}</h3>

        <p>{time}</p>

        <span>
          <MapPin size={14} />
          {location}
        </span>

      </div>

    </div>
  );
}


function Announcement({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="announcement-item">

      <div className="announcement-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

    </div>
  );
}


export default StudentDashboard;