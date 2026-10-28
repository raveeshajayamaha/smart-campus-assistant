import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
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

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");

    try {
      setLoading(true);

      const response = await fetch(
  "/api/auth/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  }
);

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      setMessage("Login successful");

      // Save logged-in user details
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      // Redirect after successful login
      setTimeout(() => {
        navigate(data.user.role === "admin" ? "/admin-dashboard" : "/student-dashboard");
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      setMessage("Cannot connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* NAVBAR */}
      <nav className="login-navbar">
        <div className="login-nav-container">

          <Link to="/" className="login-logo">
            Smart Campus <span>Assistant</span>
          </Link>

          <div className="login-nav-links">
            <Link to="/">Home</Link>
            <a href="/#about">About</a>
            <a href="/#services">Services</a>
            <a href="/#events">Events</a>
            <a href="/#assistant">AI Assistant</a>
            <a href="/#contact">Contact</a>
          </div>

        </div>
      </nav>


      {/* MAIN LOGIN AREA */}
      <main className="login-main">

        <div className="login-overlay"></div>

        <div className="login-content">

          {/* LEFT SIDE */}
          <section className="login-left">

            <span className="login-ai-label">
              AI-POWERED
            </span>

            <h1>
              Welcome Back
              <br />
              to <span>Smart Campus</span>
            </h1>

            <p>
              Log in to access campus services, events,
              academic information and your personalized
              AI assistant.
            </p>

            <div className="login-features">

              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <GraduationCap size={30} />
                </div>

                <h3>
                  Academic
                  <br />
                  Services
                </h3>
              </div>


              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <CalendarDays size={30} />
                </div>

                <h3>
                  Events &
                  <br />
                  Activities
                </h3>
              </div>


              <div className="login-feature-item">
                <div className="login-feature-icon">
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


          {/* RIGHT SIDE LOGIN CARD */}
          <section className="login-card">

            <div className="login-card-header">
              <h2>Login</h2>

              <p>
                Access your Smart Campus account
              </p>
            </div>


            <form onSubmit={handleLogin}>

              {/* EMAIL */}
              <div className="login-input-group">

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
              <div className="login-input-group">

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
                  className="password-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
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


              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="main-login-button"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}

                {!loading && <ArrowRight size={19} />}
              </button>

            </form>


            <p className="register-message">
              Don't have an account?{" "}
              <Link to="/register">
                Register here
              </Link>
            </p>


            <div className="login-divider">

              <span></span>

              <p>OR</p>

              <span></span>

            </div>


            <Link
              to="/"
              className="back-home-button"
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

export default Login;