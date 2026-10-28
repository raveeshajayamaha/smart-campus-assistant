import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import Assistant from "./pages/Assistant";
import AdminDashboard from "./pages/AdminDashboard";
import CampusPage, { Profile } from "./pages/CampusPage";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
    <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
    <Route path="/admin-dashboard" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
    {(["events", "academic", "library", "locations", "announcements"] as const).map(section => <Route key={section} path={`/${section}`} element={<ProtectedRoute><CampusPage section={section} /></ProtectedRoute>} />)}
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/map" element={<Navigate to="/locations" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
export default App;
