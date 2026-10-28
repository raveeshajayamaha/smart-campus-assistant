require("dotenv").config({ path: require("node:path").join(__dirname, ".env"), quiet: true });
const mongoose = require("mongoose");
const connectDB = require("./config/db");
async function seed() {
  await connectDB();
  const base = new Date();
  const day = offset => { const d = new Date(base); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
  const sets = [
    [require("./models/event"), [
      { title: "AI & Future Technologies Workshop", description: "Hands-on introduction to campus AI projects.", date: day(1), time: "10:00 AM - 12:00 PM", location: "Main Auditorium", image: "/images/event1.png", category: "Workshop" },
      { title: "Campus Career Fair", description: "Meet employers and explore internships.", date: day(2), time: "09:00 AM - 03:00 PM", location: "Student Centre", image: "/images/event2.png", category: "Careers" },
      { title: "Innovation Showcase", description: "Student software and engineering demonstrations.", date: day(3), time: "01:00 PM - 04:00 PM", location: "Engineering Block", image: "/images/event3.png", category: "Exhibition" }
    ]],
    [require("./models/Announcement"), [
      { title: "Semester Registration", description: "Complete registration through the faculty office this week.", category: "Academic", date: day(0), priority: "high" },
      { title: "Library Study Spaces", description: "Quiet study spaces are available on the library second floor.", category: "Library", date: day(0), priority: "normal" },
      { title: "Career Fair Registration", description: "Bring your student ID and CV to the Student Centre.", category: "Careers", date: day(0), priority: "normal" }
    ]],
    [require("./models/Schedule"), [
      { subject: "Data Structures", date: day(1), startTime: "08:30", endTime: "10:00", location: "Hall A1", type: "Lecture" },
      { subject: "Digital Systems", date: day(1), startTime: "13:00", endTime: "15:00", location: "Computer Lab 2", type: "Lab" },
      { subject: "Software Engineering", date: day(2), startTime: "10:00", endTime: "11:30", location: "Hall B2", type: "Lecture" }
    ]],
    [require("./models/LibraryResource"), [
      { title: "Introduction to Algorithms", type: "Book", description: "Algorithms and data structures reference.", availability: "5 copies available", location: "Library, Shelf CS-01" },
      { title: "Quiet Study Room", type: "Study space", description: "Individual study desks; ask at the library desk.", availability: "Open during library hours", location: "Library, Floor 2" },
      { title: "MDN Web Docs", type: "Digital resource", description: "Free web development reference.", availability: "Online", location: "Online", link: "https://developer.mozilla.org/" }
    ]],
    [require("./models/CampusLocation"), [
      { name: "Main Library", building: "Library Building", description: "Books, digital resources and quiet study areas.", category: "Library", openingHours: "Monday-Friday 08:00-18:00; Saturday 09:00-13:00; closed Sunday", directions: "From the main gate, follow the central walkway. Library is on your left." },
      { name: "Computer Lab 2", building: "Engineering Block, Floor 1", description: "Computers for practical classes and student projects.", category: "Lab", openingHours: "Monday-Friday 08:00-17:00", directions: "Enter Engineering Block, take the stairs to Floor 1, turn right." },
      { name: "Student Support Office", building: "Student Centre, Ground Floor", description: "Student welfare, societies and campus assistance.", category: "Student Services", openingHours: "Monday-Friday 09:00-16:00", directions: "Opposite the main auditorium, next to reception." },
      { name: "Main Auditorium", building: "Administration Block", description: "Campus events and presentations.", category: "Events", openingHours: "During scheduled events", directions: "Straight ahead from the main gate, beside administration reception." }
    ]]
  ];
  for (const [Model, samples] of sets) {
    let count = await Model.countDocuments();
    const target = samples.length;
    for (const sample of samples) {
      if (count >= target) break;
      const field = sample.title ? "title" : sample.subject ? "subject" : "name";
      if (!await Model.exists({ [field]: sample[field] })) { await Model.create(sample); count++; }
    }
    console.log(`${Model.modelName}: ${count} records (existing records preserved)`);
  }
}
if (require.main === module) seed().catch(() => { console.error("Seed failed. Check MongoDB configuration."); process.exitCode = 1; }).finally(() => mongoose.disconnect());
module.exports = seed;
