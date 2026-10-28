import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, logout } from "../lib/api";
import "./CampusPages.css";
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
  Library,
  Users,
  CircleHelp,
  Send,
  Clock,
} from "lucide-react";

import "./Assistant.css";

function Assistant() {
  const location = useLocation();
  const [input, setInput] = useState(typeof location.state?.question === "string" ? location.state.question : "");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);
  async function send(question: string) {
    if (!question.trim() || pending.current) return;
    pending.current = true; setLoading(true); setError(""); setInput("");
    setMessages(m => [...m, { role: "You", text: question.trim() }]);
    try { const data = await api("/assistant/chat", { method: "POST", body: JSON.stringify({ message: question.trim() }) }); setMessages(m => [...m, { role: "Assistant", text: data.reply }]); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to send message"); setInput(question); }
    finally { pending.current = false; setLoading(false); }
  }
  const questions: Record<string, string> = {
    "Academic Information": "When is my next class?", "Campus Events": "What events are coming up?", "Library Services": "What library resources are available?", "Campus Facilities": "Where is the computer lab?", "Student Services": "Where is student support?", "General Questions": "Are there any announcements?",
    "Class Timetable": "What is my class timetable?", "Exam Schedule": "What exams are scheduled?", "Library Hours": "What are the library hours?", "Campus Map": "Show campus locations", "Upcoming Events": "What events are coming up?", "Student Support": "Where is student support?"
  };
  return (
    <div className="assistant-page">

      {/* SIDEBAR */}
      <aside className="assistant-sidebar">

        <div className="assistant-logo">
          Smart Campus
          <span>Assistant</span>
        </div>

        <div className="assistant-user">

          <div className="assistant-user-icon">
            <User size={46} />
          </div>

          <h3>Student</h3>

          <p>
            <span className="online-dot"></span>
            Online
          </p>

        </div>


        <nav className="assistant-menu">

          <a href="/student-dashboard">
            <Home size={22} />
            Dashboard
          </a>

          <a className="active" href="/assistant">
            <MessageCircle size={22} />
            AI Assistant
          </a>

          <a href="/events">
            <CalendarDays size={22} />
            Events
          </a>

          <a href="/academic">
            <BookOpen size={22} />
            Academic Info
          </a>

          <a href="/library">
            <Library size={22} />
            Library
          </a>

          <a href="/locations">
            <MapPin size={22} />
            Campus Map
          </a>

          <a href="/profile">
            <User size={22} />
            Profile
          </a>

        </nav>


        <a className="assistant-logout" href="/login" onClick={e => { e.preventDefault(); void logout(); }}>
          <LogOut size={22} />
          Logout
        </a>

      </aside>


      {/* MAIN AREA */}
      <main className="assistant-main">

        {/* TOP BAR */}
        <div className="assistant-topbar">

          <div className="assistant-search">
            <Search size={21} />

            <input
              type="text"
              placeholder="Search events, services, or ask AI..." onKeyDown={e => { if (e.key === "Enter") void send(e.currentTarget.value); }}
            />
          </div>

          <div className="assistant-top-actions">

            <div className="assistant-notification">
              <Bell size={23} />
              <span>3</span>
            </div>

            <div className="assistant-profile-icon">
              <User size={24} />
            </div>

          </div>

        </div>


        {/* HERO */}
        <section className="assistant-hero">

          <div className="assistant-hero-overlay"></div>

          <div className="assistant-hero-content">

            <span className="assistant-badge">
              AI ASSISTANT
            </span>

            <h1>
              Your <span>Smart Campus</span> Companion
            </h1>

            <p>
              Get instant help with academic information,
              campus services, events and more.
            </p>

          </div>

        </section>


        {/* CONTENT */}
        <div className="assistant-layout">

          {/* LEFT CONTENT */}
          <section className="assistant-chat-area">

            {/* AI WELCOME MESSAGE */}
            <div className="assistant-message-row">

              <div className="assistant-bot-icon">
                <Bot size={28} />
              </div>

              <div>

                <div className="assistant-message">

                  <h3>Hello! 👋</h3>

                  <p>
                    I'm your Smart Campus Assistant.
                    I can help you with academic information,
                    events, library resources, campus facilities
                    and more.
                  </p>

                  <p>
                    How can I help you today?
                  </p>

                </div>

                <small className="message-time">
                  Campus information assistant
                </small>

              </div>

            </div>


            <div className="chat-transcript" ref={transcript} role="log" aria-live="polite">{messages.map((m, i) => <div className={`assistant-message ${m.role === "You" ? "chat-user" : ""}`} key={i}><h3>{m.role}</h3><p>{m.text}</p></div>)}{loading && <p role="status">Looking up campus information...</p>}</div>
            {error && <p role="alert">{error} Your question is in the input so you can retry.</p>}
            {/* SUGGESTED QUESTIONS */}
            <h2 className="try-title">
              Try asking about...
            </h2>


            <div className="assistant-topic-grid">

              <TopicCard
                onSelect={title => void send(questions[title] || title)}
                className="topic-blue"
                icon={<GraduationCap />}
                title="Academic Information"
                description="Courses, exams, timetables and results"
              />

              <TopicCard
                onSelect={title => void send(questions[title] || title)}
                className="topic-red"
                icon={<CalendarDays />}
                title="Campus Events"
                description="Upcoming events and activities"
              />

              <TopicCard
                onSelect={title => void send(questions[title] || title)}
                className="topic-green"
                icon={<BookOpen />}
                title="Library Services"
                description="Books, study spaces and resources"
              />

              <TopicCard
                onSelect={title => void send(questions[title] || title)}
                className="topic-orange"
                icon={<MapPin />}
                title="Campus Facilities"
                description="Buildings, labs, transport and more"
              />

              <TopicCard
                onSelect={title => void send(questions[title] || title)}
                className="topic-purple"
                icon={<Users />}
                title="Student Services"
                description="Clubs, societies and support services"
              />

              <TopicCard
                onSelect={title => void send(questions[title] || title)}
                className="topic-lightblue"
                icon={<CircleHelp />}
                title="General Questions"
                description="Anything about campus life"
              />

            </div>


            {/* INPUT AREA */}
            <form className="assistant-input-area" onSubmit={e => { e.preventDefault(); void send(input); }}>
              <input aria-label="Campus question" maxLength={2000} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything about your campus..." />
              <button className="send-button" type="submit" aria-label="Send message" disabled={loading || !input.trim()}><Send size={22} /></button>
            </form>

          </section>


          {/* RIGHT SIDE */}
          <aside className="assistant-right-panel">

            {/* POPULAR TOPICS */}
            <div className="assistant-side-card">

              <h2>Popular Topics</h2>

              <PopularTopic
                onSelect={title => void send(questions[title] || title)}
                className="popular-blue"
                icon={<GraduationCap />}
                text="Class Timetable"
              />

              <PopularTopic
                onSelect={title => void send(questions[title] || title)}
                className="popular-red"
                icon={<CalendarDays />}
                text="Exam Schedule"
              />

              <PopularTopic
                onSelect={title => void send(questions[title] || title)}
                className="popular-green"
                icon={<BookOpen />}
                text="Library Hours"
              />

              <PopularTopic
                onSelect={title => void send(questions[title] || title)}
                className="popular-orange"
                icon={<MapPin />}
                text="Campus Map"
              />

              <PopularTopic
                onSelect={title => void send(questions[title] || title)}
                className="popular-purple"
                icon={<CalendarDays />}
                text="Upcoming Events"
              />

              <PopularTopic
                onSelect={title => void send(questions[title] || title)}
                className="popular-lightblue"
                icon={<Users />}
                text="Student Support"
              />

            </div>


            {/* RECENT CHATS */}
            <div className="assistant-side-card recent-chats">

              <h2>
                <Clock size={19} />
                Recent Chats
              </h2>

              {messages.filter(m => m.role === "You").slice(-4).map((m, i) => <RecentChat key={i} text={m.text} time="This session" onSelect={text => void send(text)} />)}
              {!messages.length && <p>Your questions will appear here.</p>}

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}


function TopicCard({
  onSelect,
  icon,
  title,
  description,
  className,
}: {
  onSelect: (value: string) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  className: string;
}) {
  return (
    <div className={`assistant-topic-card ${className}`} role="button" tabIndex={0} onClick={() => onSelect(title)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(title); } }}>

      <div className="topic-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

    </div>
  );
}


function PopularTopic({
  onSelect,
  icon,
  text,
  className,
}: {
  onSelect: (value: string) => void;
  icon: React.ReactNode;
  text: string;
  className: string;
}) {
  return (
    <div className={`popular-topic ${className}`} role="button" tabIndex={0} onClick={() => onSelect(text)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(text); } }}>

      <div className="popular-topic-left">
        {icon}
        <span>{text}</span>
      </div>

      <ArrowRight size={17} />

    </div>
  );
}


function RecentChat({
  onSelect,
  text,
  time,
}: {
  onSelect: (value: string) => void;
  text: string;
  time: string;
}) {
  return (
    <div className="recent-chat-item" role="button" tabIndex={0} onClick={() => onSelect(text)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(text); } }}>

      <div className="recent-chat-left">

        <MessageCircle size={15} />

        <span>{text}</span>

      </div>

      <small>{time}</small>

    </div>
  );
}


export default Assistant;