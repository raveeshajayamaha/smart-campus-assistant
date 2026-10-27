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
  Paperclip,
  Clock,
} from "lucide-react";

import "./Assistant.css";

function Assistant() {
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

          <a href="#">
            <CalendarDays size={22} />
            Events
          </a>

          <a href="#">
            <BookOpen size={22} />
            Academic Info
          </a>

          <a href="#">
            <Library size={22} />
            Library
          </a>

          <a href="#">
            <MapPin size={22} />
            Campus Map
          </a>

          <a href="#">
            <User size={22} />
            Profile
          </a>

        </nav>


        <a className="assistant-logout" href="/login">
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
              placeholder="Search events, services, or ask AI..."
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
                  10:24 AM
                </small>

              </div>

            </div>


            {/* SUGGESTED QUESTIONS */}
            <h2 className="try-title">
              Try asking about...
            </h2>


            <div className="assistant-topic-grid">

              <TopicCard
                className="topic-blue"
                icon={<GraduationCap />}
                title="Academic Information"
                description="Courses, exams, timetables and results"
              />

              <TopicCard
                className="topic-red"
                icon={<CalendarDays />}
                title="Campus Events"
                description="Upcoming events and activities"
              />

              <TopicCard
                className="topic-green"
                icon={<BookOpen />}
                title="Library Services"
                description="Books, study spaces and resources"
              />

              <TopicCard
                className="topic-orange"
                icon={<MapPin />}
                title="Campus Facilities"
                description="Buildings, labs, transport and more"
              />

              <TopicCard
                className="topic-purple"
                icon={<Users />}
                title="Student Services"
                description="Clubs, societies and support services"
              />

              <TopicCard
                className="topic-lightblue"
                icon={<CircleHelp />}
                title="General Questions"
                description="Anything about campus life"
              />

            </div>


            {/* INPUT AREA */}
            <div className="assistant-input-area">

              <button className="attach-button">
                <Paperclip size={22} />
              </button>

              <input
                type="text"
                placeholder="Ask me anything about your campus..."
              />

              <button className="send-button">
                <Send size={22} />
              </button>

            </div>

          </section>


          {/* RIGHT SIDE */}
          <aside className="assistant-right-panel">

            {/* POPULAR TOPICS */}
            <div className="assistant-side-card">

              <h2>Popular Topics</h2>

              <PopularTopic
                className="popular-blue"
                icon={<GraduationCap />}
                text="Class Timetable"
              />

              <PopularTopic
                className="popular-red"
                icon={<CalendarDays />}
                text="Exam Schedule"
              />

              <PopularTopic
                className="popular-green"
                icon={<BookOpen />}
                text="Library Hours"
              />

              <PopularTopic
                className="popular-orange"
                icon={<MapPin />}
                text="Campus Map"
              />

              <PopularTopic
                className="popular-purple"
                icon={<CalendarDays />}
                text="Upcoming Events"
              />

              <PopularTopic
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

              <RecentChat
                text="Library opening hours"
                time="2 hours ago"
              />

              <RecentChat
                text="Where is the computer lab?"
                time="1 day ago"
              />

              <RecentChat
                text="Upcoming events this week"
                time="2 days ago"
              />

              <RecentChat
                text="How to register for courses?"
                time="3 days ago"
              />

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}


function TopicCard({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className: string;
}) {
  return (
    <div className={`assistant-topic-card ${className}`}>

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
  icon,
  text,
  className,
}: {
  icon: React.ReactNode;
  text: string;
  className: string;
}) {
  return (
    <div className={`popular-topic ${className}`}>

      <div className="popular-topic-left">
        {icon}
        <span>{text}</span>
      </div>

      <ArrowRight size={17} />

    </div>
  );
}


function RecentChat({
  text,
  time,
}: {
  text: string;
  time: string;
}) {
  return (
    <div className="recent-chat-item">

      <div className="recent-chat-left">

        <MessageCircle size={15} />

        <span>{text}</span>

      </div>

      <small>{time}</small>

    </div>
  );
}


export default Assistant;