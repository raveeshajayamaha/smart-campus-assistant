const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
// Every run uses its own database and cleans only records created by this test.
process.env.MONGO_DB_NAME = "campus_test_" + crypto.randomBytes(8).toString("hex");
const { app } = require("../server");
const connectDB = require("../config/db");
const User = require("../models/User");
const Session = require("../models/Session");
const models = [require("../models/event"), require("../models/Announcement"), require("../models/Schedule"), require("../models/LibraryResource"), require("../models/CampusLocation")];
test("campus API: registration, sessions, roles, CRUD, validation, assistant and logout", { timeout: 60000 }, async t => {
  let server;
  const created = [];
  const users = [];
  try {
    await connectDB();
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.on("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    async function request(path, method = "GET", body, token) {
      const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, data: await response.json() };
    }
    const credentials = { name: "Campus Test Student", email: "student@example.test", password: "CampusDemo123" };
    await t.test("registration validation and privilege escalation prevention", async () => {
      assert.equal((await request("/auth/register", "POST", {})).status, 400);
      const registered = await request("/auth/register", "POST", { ...credentials, role: "admin" });
      assert.equal(registered.status, 201); assert.equal(registered.data.user.role, "student"); users.push(registered.data.user.id);
      assert.equal((await request("/auth/register", "POST", credentials)).status, 400);
      const admin = await request("/auth/register", "POST", { ...credentials, email: "admin@example.test" });
      users.push(admin.data.user.id);
      await User.findByIdAndUpdate(admin.data.user.id, { role: "admin" });
    });
    const studentLogin = await request("/auth/login", "POST", credentials);
    const adminLogin = await request("/auth/login", "POST", { ...credentials, email: "admin@example.test" });
    const student = studentLogin.data.token;
    const admin = adminLogin.data.token;
    await t.test("login, authenticated identity and access restrictions", async () => {
      assert.equal(studentLogin.status, 200); assert.equal(adminLogin.data.user.role, "admin");
      assert.equal((await request("/auth/login", "POST", { ...credentials, password: "wrong" })).status, 400);
      assert.equal((await request("/auth/me", "GET", undefined, student)).data.user.email, credentials.email);
      assert.equal((await request("/schedules")).status, 401);
      assert.equal((await request("/events", "POST", {}, student)).status, 403);
      assert.equal((await request("/events", "POST", {})).status, 401);
    });
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const samples = [
      ["events", "event", "events", { title: "Test Robotics Fair", description: "Robotics demos", date: tomorrow, time: "10:00 AM", location: "Main Hall" }],
      ["announcements", "announcement", "announcements", { title: "Test Registration", description: "Register this week", category: "Academic", date: tomorrow, priority: "high" }],
      ["schedules", "schedule", "schedules", { subject: "Test Algorithms", date: tomorrow, startTime: "09:00", endTime: "10:00", location: "Room 1", type: "Lecture" }],
      ["library", "resource", "resources", { title: "Test Algorithms Book", type: "Book", description: "Algorithms reference", availability: "Available", location: "Shelf A" }],
      ["locations", "location", "locations", { name: "Computer Lab", building: "Engineering", description: "Computers for students", category: "Lab", openingHours: "08:00-17:00", directions: "First floor" }]
    ];
    for (let index = 0; index < samples.length; index++) {
      const [path, singular, plural, body] = samples[index];
      await t.test(`${path}: create/read/update validation and missing IDs`, async () => {
        assert.equal((await request(`/${path}`, "POST", {}, admin)).status, 400);
        const added = await request(`/${path}`, "POST", body, admin);
        assert.equal(added.status, 201); const id = added.data[singular]._id; created.push([models[index], id, path]);
        const list = await request(`/${path}`, "GET", undefined, student); assert.equal(list.status, 200); assert.ok(list.data[plural].some(r => r._id === id));
        const field = body.title ? "title" : body.subject ? "subject" : "name";
        assert.equal((await request(`/${path}/${id}`, "PUT", { [field]: "" }, admin)).status, 400);
        const updated = await request(`/${path}/${id}`, "PUT", { ...body, description: body.description || "Updated" }, admin); assert.equal(updated.status, 200);
        assert.equal((await request(`/${path}/bad-id`, "DELETE", undefined, admin)).status, 400);
        assert.equal((await request(`/${path}/${new mongoose.Types.ObjectId()}`, "PUT", body, admin)).status, 404);
        assert.equal((await request(`/${path}/${id}`, "DELETE", undefined, student)).status, 403);
      });
    }
    await t.test("date, schedule time, priority, link and malformed JSON validation", async () => {
      assert.equal((await request("/events", "POST", { ...samples[0][3], date: "invalid" }, admin)).status, 400);
      assert.equal((await request("/schedules", "POST", { ...samples[2][3], endTime: "08:00" }, admin)).status, 400);
      assert.equal((await request("/schedules", "POST", { ...samples[2][3], startTime: "25:00" }, admin)).status, 400);
      assert.equal((await request("/announcements", "POST", { ...samples[1][3], priority: "invalid" }, admin)).status, 400);
      assert.equal((await request("/library", "POST", { ...samples[3][3], link: "javascript:alert(1)" }, admin)).status, 400);
      const malformed = await fetch(base + "/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }); assert.equal(malformed.status, 400);
    });
    const libraryLocation = await models[4].create({ name: "Main Library", building: "Library Building", description: "Books and desks", category: "Library", openingHours: "Monday-Friday 08:00-18:00", directions: "Central walkway" });
    created.push([models[4], libraryLocation._id, "locations"]);
    await t.test("assistant uses each collection and handles missing data", async () => {
      const questions = [["What events are coming up?", "Test Robotics Fair"], ["When is my next class?", "Test Algorithms"], ["What are the library hours?", "08:00-18:00"], ["Where is the computer lab?", "Engineering"], ["Are there any announcements?", "Test Registration"], ["What library resources are available?", "Test Algorithms Book"], ["What exams are scheduled?", "No matching information"]];
      for (const [message, expected] of questions) { const r = await request("/assistant/chat", "POST", { message }, student); assert.equal(r.status, 200); assert.ok(r.data.reply.includes(expected), r.data.reply); }
      assert.equal((await request("/assistant/chat", "POST", { message: " " }, student)).status, 400);
      assert.equal((await request("/assistant/chat", "POST", { message: "Hello" })).status, 401);
    });
    await t.test("admin deletes records and receives 404 when absent", async () => {
      for (const [, id, path] of created) { assert.equal((await request(`/${path}/${id}`, "DELETE", undefined, admin)).status, 200); assert.equal((await request(`/${path}/${id}`, "DELETE", undefined, admin)).status, 404); }
    });
    await t.test("logout revokes session; expired sessions are rejected", async () => {
      assert.equal((await request("/auth/logout", "POST", {}, student)).status, 200);
      assert.equal((await request("/auth/me", "GET", undefined, student)).status, 401);
      await Session.updateOne({ user: adminLogin.data.user.id }, { expiresAt: new Date(0) });
      assert.equal((await request("/auth/me", "GET", undefined, admin)).status, 401);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) {
      for (const [Model, id] of created) await Model.deleteOne({ _id: id });
      await Session.deleteMany({ user: { $in: users } });
      await User.deleteMany({ _id: { $in: users } });
    }
    await mongoose.disconnect();
  }
});
