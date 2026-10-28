const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: require("node:path").join(__dirname, ".env"), quiet: true });
const connectDB = require("./config/db");
const resources = require("./routes/resourceRoutes");
const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5175"], credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/announcements", resources(require("./models/Announcement"), "announcements", "announcement", { date: -1 }));
app.use("/api/schedules", resources(require("./models/Schedule"), "schedules", "schedule", { date: 1, startTime: 1 }));
app.use("/api/library", resources(require("./models/LibraryResource"), "resources", "resource"));
app.use("/api/locations", resources(require("./models/CampusLocation"), "locations", "location", { name: 1 }));
app.use("/api/assistant", require("./routes/assistantRoutes"));
app.get("/", (req, res) => res.send("Smart Campus Assistant Backend is Running"));
app.get("/api/test", (req, res) => res.json({ success: true, message: "Smart Campus API is working" }));
app.use((req, res) => res.status(404).json({ success: false, message: "API route not found" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const invalid = ["ValidationError", "CastError", "StrictModeError"].includes(error.name) || error.type === "entity.parse.failed" || error.code === 11000;
  res.status(invalid ? 400 : error.status === 413 ? 413 : 500).json({ success: false, message: invalid ? "Invalid input. Check required fields, dates, times and links." : "Unable to complete request. Please try again." });
});
async function start() {
  await connectDB();
  const server = app.listen(process.env.PORT || 5000, () => console.log(`Server running on http://localhost:${process.env.PORT || 5000}`));
  return server;
}
if (require.main === module) start().catch(() => { console.error("Backend startup failed. Check MongoDB access and MONGO_URI in backend/.env."); process.exit(1); });
module.exports = { app, start };
