const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
process.env.MONGO_DB_NAME = "campus_profile_test_" + crypto.randomBytes(8).toString("hex");
const { app } = require("../server");
const connectDB = require("../config/db");
const User = require("../models/User");
const Session = require("../models/Session");

test("own-profile updates preserve identity, sessions and authorization", { timeout: 60000 }, async t => {
  let server;
  const ids = [];
  try {
    await connectDB();
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.on("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    async function request(route, method = "GET", body, token) {
      const response = await fetch(base + route, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, data: await response.json() };
    }
    const credentials = { name: "Original Student", email: "profile@example.test", password: "CampusDemo123" };
    const registered = await request("/register", "POST", credentials);
    assert.equal(registered.status, 201); ids.push(registered.data.user.id);
    const other = await request("/register", "POST", { ...credentials, email: "other@example.test" }); ids.push(other.data.user.id);
    const login = await request("/login", "POST", credentials);
    const token = login.data.token;
    const passwordHash = (await User.findById(ids[0])).password;
    const update = { name: "  Updated Student  ", studentId: "  ST-001  ", faculty: " Computing ", department: " Software Engineering ", yearSemester: " Year 2 / Semester 1 ", contactNumber: " +94 (77) 123-4567 " };

    await t.test("requires authentication and rejects mass assignment and targeting another user", async () => {
      assert.equal((await request("/profile", "PUT", update)).status, 401);
      for (const field of ["id", "_id", "userId", "email", "role", "password", "createdAt", "$set", "studentId.value"]) {
        assert.equal((await request("/profile", "PUT", { ...update, [field]: field === "role" ? "admin" : other.data.user.id }, token)).status, 400, field);
      }
      assert.equal((await User.findById(ids[0])).name, credentials.name);
      assert.equal((await User.findById(ids[1])).name, credentials.name);
    });
    await t.test("validates strings, lengths, required name and contact format without partial saves", async () => {
      for (const body of [{}, [], null, { name: " " }, { faculty: {} }, { studentId: 123 }, { name: "a".repeat(121) }, { studentId: "a".repeat(61) }, { faculty: "a".repeat(121) }, { department: "a".repeat(121) }, { yearSemester: "a".repeat(61) }, { contactNumber: "letters" }, { contactNumber: "+---" }, { department: "a\nb" }]) {
        assert.equal((await request("/profile", "PUT", body, token)).status, 400, JSON.stringify(body));
      }
      assert.equal((await User.findById(ids[0])).name, credentials.name);
    });
    await t.test("trims and persists all fields, returns only safe data, and survives fresh identity requests", async () => {
      const saved = await request("/profile", "PUT", update, token);
      assert.equal(saved.status, 200);
      const expected = Object.fromEntries(Object.entries(update).map(([key, value]) => [key, value.trim()]));
      const persisted = await User.findById(ids[0]);
      const refreshed = await request("/me", "GET", undefined, token);
      for (const [key, value] of Object.entries(expected)) {
        assert.equal(saved.data.user[key], value); assert.equal(persisted[key], value); assert.equal(refreshed.data.user[key], value);
      }
      assert.equal(saved.data.user.email, credentials.email); assert.equal(saved.data.user.role, "student");
      assert.equal(persisted.password, passwordHash); assert.equal(persisted.email, credentials.email); assert.equal(persisted.role, "student");
      assert.equal((await User.findById(ids[1])).studentId, undefined);
      for (const response of [saved, refreshed, login, registered]) {
        assert.equal(response.data.user.password, undefined); assert.equal(response.data.user.__v, undefined);
        assert.ok(!JSON.stringify(response.data.user).includes(passwordHash));
      }
      assert.ok(saved.data.user.createdAt); assert.ok(saved.data.user.updatedAt);
    });
    await t.test("optional fields can be cleared and omitted fields remain unchanged", async () => {
      assert.equal((await request("/profile", "PUT", { studentId: " " }, token)).status, 200);
      const me = await request("/me", "GET", undefined, token);
      assert.equal(me.data.user.studentId, ""); assert.equal(me.data.user.faculty, "Computing");
    });
    await t.test("server errors return a safe message", async () => {
      const original = User.findByIdAndUpdate;
      try {
        User.findByIdAndUpdate = async () => { throw new Error("sensitive database detail"); };
        const failed = await request("/profile", "PUT", { name: "Temporary" }, token);
        assert.equal(failed.status, 500); assert.ok(failed.data.message.includes("Unable to complete request"));
        assert.ok(!JSON.stringify(failed.data).includes("sensitive"));
      } finally { User.findByIdAndUpdate = original; }
    });
    await t.test("logout revokes updates and login restores persisted profile without changing privileges", async () => {
      assert.equal((await request("/logout", "POST", {}, token)).status, 200);
      assert.equal((await request("/profile", "PUT", update, token)).status, 401);
      const again = await request("/login", "POST", credentials);
      assert.equal(again.status, 200); assert.equal(again.data.user.name, "Updated Student");
      assert.equal(again.data.user.faculty, "Computing"); assert.equal(again.data.user.role, "student");
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/events`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${again.data.token}` }, body: "{}" });
      assert.equal(response.status, 403);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) { await Session.deleteMany({ user: { $in: ids } }); await User.deleteMany({ _id: { $in: ids } }); }
    await mongoose.disconnect();
  }
});
