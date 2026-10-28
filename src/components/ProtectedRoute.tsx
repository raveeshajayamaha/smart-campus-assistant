import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { api, type CampusUser } from "../lib/api";
export default function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [user, setUser] = useState<CampusUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  useEffect(() => {
    let active = true;
    if (!token) return;
    api("/auth/me").then(data => { if (active) { setUser(data.user); localStorage.setItem("user", JSON.stringify(data.user)); } })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : "Unable to verify session"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <p role="status">Checking your session...</p>;
  if (error) return <p role="alert">{error} <button onClick={() => window.location.reload()}>Retry</button></p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/student-dashboard" replace />;
  return children;
}
