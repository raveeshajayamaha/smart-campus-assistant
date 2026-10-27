import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  GraduationCap,
  MapPin,
  CalendarDays,
  BookOpen,
  Users,
  FileText,
  MessageCircle,
  Zap,
} from "lucide-react";

import "./Home.css";

function Home() {
  return (
    <div className="home-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">

          <h2 className="logo">
            Smart Campus Assistant
          </h2>

          <div className="nav-links">
            <a href="#home" className="active">Home</a>
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#events">Events</a>
            <a href="#assistant">AI Assistant</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="nav-actions">
            <button className="search-button">
              <Search size={20} />
            </button>

            <Link to="/login" className="login-button">
              Login
            </Link>

            <Link to="/register" className="register-button">
              Register
            </Link>
          </div>

        </div>
      </nav>


      {/* HERO SECTION */}
      <section className="hero" id="home">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <div className="hero-left">

            <span className="ai-label">
              AI-POWERED
            </span>

            <h1>
              Your Smart Companion
              <br />
              for a Better
              <span> Campus Life</span>
            </h1>

            <p>
              Get instant answers, explore campus services, stay updated
              with events, and easily access important information — all
              in one place.
            </p>

            <div className="hero-buttons">

              <Link
                to="/assistant"
                className="primary-button"
              >
                Get Started
                <ArrowRight size={18} />
              </Link>

              <a
                href="#services"
                className="secondary-button"
              >
                Learn More
              </a>

            </div>

          </div>


          <div className="hero-right">

            <div className="question question-one">
              <MapPin size={22} />
              <span>Find lecture halls?</span>
            </div>

            <div className="question question-two">
              <CalendarDays size={22} />
              <span>When is the next event?</span>
            </div>

            <div className="question question-three">
              <FileText size={22} />
              <span>How can I contact the academic office?</span>
            </div>

            <div className="question question-four">
              <BookOpen size={22} />
              <span>Show library hours</span>
            </div>

            <img
              src="/images/ai_robot.png"
              alt="AI Campus Assistant"
              className="robot-image"
            />

          </div>

        </div>


        {/* STATISTICS */}

        <div className="stats-container">

          <div className="stat">
            <Users />
            <div>
              <h3>10K+</h3>
              <p>Students Supported</p>
            </div>
          </div>

          <div className="stat">
            <CalendarDays />
            <div>
              <h3>100+</h3>
              <p>Campus Events</p>
            </div>
          </div>

          <div className="stat">
            <GraduationCap />
            <div>
              <h3>20+</h3>
              <p>Campus Services</p>
            </div>
          </div>

          <div className="stat">
            <Zap />
            <div>
              <h3>24/7</h3>
              <p>AI Assistance</p>
            </div>
          </div>

        </div>

      </section>


      {/* QUICK SERVICES */}

      <section className="services-section" id="services">

        <div className="section-heading">

          <span>QUICK SERVICES</span>

          <h2>
            Everything You Need
            <br />
            in One Place
          </h2>

          <p>
            Access important campus services quickly and easily.
          </p>

          <button className="outline-button">
            View All Services
            <ArrowRight size={17} />
          </button>

        </div>


        <div className="service-grid">

          <ServiceCard
            icon={<GraduationCap />}
            title="Academic Information"
          />

          <ServiceCard
            icon={<MapPin />}
            title="Campus Locations"
          />

          <ServiceCard
            icon={<CalendarDays />}
            title="Events & Activities"
          />

          <ServiceCard
            icon={<BookOpen />}
            title="Library Services"
          />

          <ServiceCard
            icon={<Users />}
            title="Student Support"
          />

          <ServiceCard
            icon={<FileText />}
            title="Forms & Requests"
          />

        </div>

      </section>


      {/* EVENTS */}

      <section className="events-section" id="events">

        <div className="section-heading">

          <span>UPCOMING EVENTS</span>

          <h2>
            Discover What's Happening
            <br />
            on Campus
          </h2>

          <p>
            Stay updated with workshops, seminars,
            competitions and more.
          </p>

          <button className="outline-button">
            View All Events
            <ArrowRight size={17} />
          </button>

        </div>


        <div className="events-grid">

          <EventCard
            date="10"
            title="AI & Future Technologies Workshop"
            location="Engineering Faculty Hall"
            time="9.00 AM – 12.00 PM"
          />

          <EventCard
            date="15"
            title="Student Innovation Expo"
            location="University Premises"
            time="9.00 AM – 4.00 PM"
          />

          <EventCard
            date="22"
            title="Career Guidance Seminar"
            location="Main Auditorium"
            time="10.00 AM – 12.00 PM"
          />

        </div>

      </section>


      {/* AI ASSISTANT */}

      <section className="assistant-section" id="assistant">

        <div className="assistant-text">

          <span>AI CAMPUS ASSISTANT</span>

          <h2>
            Have Questions?
            <br />
            Ask Our AI Assistant
          </h2>

          <p>
            Get instant answers to your campus-related
            questions anytime, anywhere.
          </p>

        </div>


        <div className="assistant-chat">

          <div className="chat-input">

            <MessageCircle size={21} />

            <input
              type="text"
              placeholder="Ask anything about the campus..."
            />

            <button>
              <ArrowRight />
            </button>

          </div>

          <div className="suggestions">

            <button>Library hours</button>

            <button>Academic calendar</button>

            <button>Find a lecture hall</button>

            <button>Contact support</button>

          </div>

        </div>

      </section>

    </div>
  );
}


function ServiceCard({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="service-card">

      <div className="service-icon">
        {icon}
      </div>

      <h3>{title}</h3>

    </div>
  );
}


function EventCard({
  date,
  title,
  location,
  time,
}: {
  date: string;
  title: string;
  location: string;
  time: string;
}) {
  return (
    <div className="event-card">

      <div className="event-image">

        <div className="event-date">
          <small>OCT</small>
          <strong>{date}</strong>
        </div>

      </div>

      <div className="event-info">

        <h3>{title}</h3>

        <p>
          <MapPin size={14} />
          {location}
        </p>

        <p>
          <CalendarDays size={14} />
          {time}
        </p>

      </div>

    </div>
  );
}


export default Home;