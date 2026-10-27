import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  CalendarDays,
  BookOpen,
  Home as HomeIcon,
} from "lucide-react";

import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role: "student",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed");
        return;
      }

      setMessage("Registration successful");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Cannot connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* NAVBAR */}
      <nav className="register-navbar">
        <div className="register-nav-container">

          <Link to="/" className="register-logo">
            Smart Campus <span>Assistant</span>
          </Link>

          <div className="register-nav-links">
            <Link to="/">Home</Link>
            <a href="/#about">About</a>
            <a href="/#services">Services</a>
            <a href="/#events">Events</a>
            <a href="/#assistant">AI Assistant</a>
            <a href="/#contact">Contact</a>
          </div>

        </div>
      </nav>


      {/* MAIN AREA */}
      <main className="register-main">

        <div className="register-overlay"></div>

        <div className="register-content">

          {/* LEFT SIDE */}
          <section className="register-left">

            <span className="register-ai-label">
              AI-POWERED
            </span>

            <h1>
              Create Your
              <br />
              <span>Smart Campus</span>
              <br />
              Account
            </h1>

            <p>
              Join Smart Campus Assistant to access academic services,
              events, library resources and your personalized AI assistant.
            </p>

            <div className="register-features">

              <div className="register-feature-item">
                <div className="register-feature-icon">
                  <GraduationCap size={30} />
                </div>

                <h3>
                  Academic
                  <br />
                  Services
                </h3>
              </div>

              <div className="register-feature-item">
                <div className="register-feature-icon">
                  <CalendarDays size={30} />
                </div>

                <h3>
                  Events &
                  <br />
                  Activities
                </h3>
              </div>

              <div className="register-feature-item">
                <div className="register-feature-icon">
                  <BookOpen size={30} />
                </div>

                <h3>
                  Library
                  <br />
                  Access
                </h3>
              </div>

            </div>

          </section>


          {/* REGISTER CARD */}
          <section className="register-card">

            <div className="register-card-header">

              <h2>Create Account</h2>

              <p>
                Join Smart Campus Assistant
              </p>

            </div>


            <form onSubmit={handleRegister}>

              {/* FULL NAME */}
              <div className="register-input-group">

                <User size={21} />

                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

              </div>


              {/* EMAIL */}
              <div className="register-input-group">

                <Mail size={21} />

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

              </div>


              {/* PASSWORD */}
              <div className="register-input-group">

                <Lock size={21} />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="register-password-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>


              {/* CONFIRM PASSWORD */}
              <div className="register-input-group">

                <Lock size={21} />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="register-password-eye"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>


              {/* MESSAGE */}
              {message && (
                <p
                  style={{
                    marginBottom: "14px",
                    textAlign: "center",
                  }}
                >
                  {message}
                </p>
              )}


              {/* REGISTER BUTTON */}
              <button
                type="submit"
                className="main-register-button"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}

                {!loading && <ArrowRight size={19} />}
              </button>

            </form>


            <p className="login-message">

              Already have an account?{" "}

              <Link to="/login">
                Login here
              </Link>

            </p>


            {/* DIVIDER */}
            <div className="register-divider">

              <span></span>

              <p>OR</p>

              <span></span>

            </div>


            {/* BACK HOME */}
            <Link
              to="/"
              className="register-back-home"
            >
              <HomeIcon size={21} />
              Back to Home
            </Link>

          </section>

        </div>

      </main>

    </div>
  );
}

export default Register;