const express = require("express");
const { authenticate } = require("../middleware/auth");
const Event = require("../models/event");
const Announcement = require("../models/Announcement");
const Schedule = require("../models/Schedule");
const Library = require("../models/LibraryResource");
const Location = require("../models/CampusLocation");
const router = express.Router();
const date = value => new Date(value).toLocaleDateString("en-GB", { timeZone: "Asia/Colombo" });
function relevant(records, message) {
  const stop = new Set("what where when are the is a an my any for of in on do can you me tell about opening hours campus please".split(" "));
  const words = message.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
  const scored = records.map(r => ({ r, score: words.filter(w => JSON.stringify(r).toLowerCase().includes(w)).length }));
  const max = Math.max(0, ...scored.map(x => x.score));
  return max ? scored.filter(x => x.score === max).map(x => x.r) : records;
}
router.post("/chat", authenticate, async (req, res) => {
  if (typeof req.body?.message !== "string" || !req.body.message.trim() || req.body.message.length > 2000) return res.status(400).json({ success: false, message: "Enter a message of 1 to 2000 characters" });
  const q = req.body.message.toLowerCase();
  const sections = [];
  const sources = [];
  const add = (label, records, format) => {
    sources.push(...records.slice(0, 5).map(r => ({ collection: label, id: r._id })));
    sections.push(label + ":\n" + (records.length ? records.slice(0, 5).map(format).join("\n") : "No matching information is currently available."));
  };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todayDate = new Date(today + "T00:00:00.000Z");
  if (/event|workshop|activity|activities|fair/.test(q)) add("Events", relevant(await Event.find({ date: { $gte: todayDate } }).sort({ date: 1 }).lean(), q), r => `${r.title} - ${date(r.date)}, ${r.time}, ${r.location}. ${r.description}`);
  if (/announcement|notice|notification|registration|support|student service/.test(q)) add("Announcements", relevant(await Announcement.find().sort({ date: -1 }).lean(), q), r => `${r.title} (${r.priority}, ${date(r.date)}): ${r.description}`);
  if (/class|schedule|timetable|academic|lecture|exam|course/.test(q)) {
    let records = await Schedule.find({ date: { $gte: todayDate } }).sort({ date: 1, startTime: 1 }).lean();
    const now = new Date();
    records = records.filter(r => new Date(new Date(r.date).toISOString().slice(0, 10) + "T" + r.startTime + ":00+05:30") > now);
    if (/exam/.test(q)) records = records.filter(r => /exam/i.test(r.type + " " + r.subject));
    records = relevant(records, q);
    if (/next/.test(q)) records = records.slice(0, 1);
    add("Schedules", records, r => `${r.subject} - ${date(r.date)}, ${r.startTime}-${r.endTime}, ${r.location} (${r.type}).`);
  }
  if (/library|book|study space|resource/.test(q)) {
    if (/hour|open|clos/.test(q)) add("Library hours", await Location.find({ category: /library/i }).lean(), r => `${r.name}: ${r.openingHours}. ${r.building}. ${r.directions}`);
    else add("Library resources", relevant(await Library.find().lean(), q), r => `${r.title}: ${r.description} Availability: ${r.availability}. Location: ${r.location}.${r.link ? " Link: " + r.link : ""}`);
  }
  if (/where|location|map|direction|building|lab|facilit|transport/.test(q)) add("Campus locations", relevant(await Location.find().lean(), q), r => `${r.name} - ${r.building}. ${r.description} Hours: ${r.openingHours}. Directions: ${r.directions}`);
  const reply = sections.length ? sections.join("\n\n") : "I can look up campus events, announcements, class schedules, library resources and campus locations. Try asking: When is my next class? What are the library hours? Where is the computer lab?";
  res.json({ success: true, reply, sources, mode: "campus-data" });
});
module.exports = router;
