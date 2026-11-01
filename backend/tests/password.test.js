const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
process.env.MONGO_DB_NAME = "campus_password_test_" + crypto.randomBytes(8).toString("hex");
const { app } = require("../server");
const connectDB = require("../config/db");
const User = require("../models/User");
const Session = require("../models/Session");

test("password changes validate credentials, persist hashes and revoke sessions", { timeout: 60000 }, async t => {
  let server;
  const ids = [];
  try {
    await connectDB(); server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.on("listening", resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    async function request(route, method = "GET", body, token) {
      const response = await fetch(base + route, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: response.status, data: await response.json() };
    }
    const credentials = { name: "Password Student", email: "password@example.test", password: "CampusDemo123" };
    for (const email of [credentials.email, "other-password@example.test"]) {
      const created = await request("/register", "POST", { ...credentials, email }); assert.equal(created.status, 201); ids.push(created.data.user.id);
    }
    const login = await request("/login", "POST", credentials);
    const token = login.data.token;
    const secondToken = (await request("/login", "POST", credentials)).data.token;
    const otherToken = (await request("/login", "POST", { ...credentials, email: "other-password@example.test" })).data.token;
    const originalHash = (await User.findById(ids[0])).password;
    const otherHash = (await User.findById(ids[1])).password;
    const valid = { currentPassword: credentials.password, newPassword: "NewCampus456", confirmPassword: "NewCampus456" };
    await t.test("requires auth and rejects targeting, role, email and unknown fields", async () => {
      assert.equal((await request("/change-password", "PUT", valid)).status, 401);
      for (const key of ["id", "_id", "userId", "role", "email", "password", "$set"]) assert.equal((await request("/change-password", "PUT", { ...valid, [key]: ids[1] }, token)).status, 400);
    });
    await t.test("rejects missing, invalid, mismatched, same and bcrypt-truncated passwords", async () => {
      for (const body of [null, [], {}, { ...valid, currentPassword: "" }, { ...valid, newPassword: 123456 }, { ...valid, confirmPassword: "" }, { ...valid, newPassword: "short", confirmPassword: "short" }, { ...valid, newPassword: "a".repeat(73), confirmPassword: "a".repeat(73) }, { ...valid, newPassword: String.fromCharCode(0x754c).repeat(25), confirmPassword: String.fromCharCode(0x754c).repeat(25) }, { ...valid, confirmPassword: "Mismatch123" }, { ...valid, newPassword: credentials.password, confirmPassword: credentials.password }]) {
        assert.equal((await request("/change-password", "PUT", body, token)).status, 400);
      }
      assert.equal((await User.findById(ids[0])).password, originalHash);
    });
    await t.test("incorrect current password fails without revoking valid sessions", async () => {
      const failed = await request("/change-password", "PUT", { ...valid, currentPassword: "Incorrect123" }, token);
      assert.equal(failed.status, 400); assert.equal(failed.data.message, "Current password is incorrect.");
      assert.equal((await request("/me", "GET", undefined, token)).status, 200);
    });
    await t.test("database failure returns safe error and leaves the old password valid", async () => {
      const original = Session.deleteMany;
      try {
        Session.deleteMany = async () => { throw new Error("private database details"); };
        const failed = await request("/change-password", "PUT", valid, token);
        assert.equal(failed.status, 500); assert.ok(failed.data.message.includes("Unable to complete request"));
        assert.ok(!JSON.stringify(failed.data).includes("private"));
        assert.equal((await User.findById(ids[0])).password, originalHash);
      } finally { Session.deleteMany = original; }
    });
    await t.test("saves a bcrypt hash only for the authenticated user and returns no secrets", async () => {
      const result = await request("/change-password", "PUT", valid, token);
      assert.equal(result.status, 200); assert.equal(result.data.success, true);
      assert.deepEqual(Object.keys(result.data).sort(), ["message", "success"]);
      const saved = await User.findById(ids[0]);
      assert.notEqual(saved.password, originalHash); assert.notEqual(saved.password, valid.newPassword);
      assert.equal(await bcrypt.compare(valid.newPassword, saved.password), true);
      assert.equal(await bcrypt.compare(credentials.password, saved.password), false);
      assert.equal(saved.email, credentials.email); assert.equal(saved.role, "student");
      assert.equal((await User.findById(ids[1])).password, otherHash);
      for (const secret of [credentials.password, valid.newPassword, saved.password]) assert.ok(!JSON.stringify(result.data).includes(secret));
    });
    await t.test("revokes all own sessions, rejects old login, permits new login and preserves others", async () => {
      assert.equal((await request("/me", "GET", undefined, token)).status, 401);
      assert.equal((await request("/me", "GET", undefined, secondToken)).status, 401);
      assert.equal((await request("/me", "GET", undefined, otherToken)).status, 200);
      assert.equal((await request("/login", "POST", credentials)).status, 400);
      const fresh = await request("/login", "POST", { ...credentials, password: valid.newPassword });
      assert.equal(fresh.status, 200);
      assert.equal((await request("/profile", "PUT", { faculty: "Computing" }, fresh.data.token)).status, 200);
      assert.equal((await request("/me", "GET", undefined, fresh.data.token)).data.user.faculty, "Computing");
      assert.equal((await request("/logout", "POST", {}, fresh.data.token)).status, 200);
      assert.equal((await request("/me", "GET", undefined, fresh.data.token)).status, 401);
      assert.equal((await request("/login", "POST", { ...credentials, password: valid.newPassword })).status, 200);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) { await Session.deleteMany({ user: { $in: ids } }); await User.deleteMany({ _id: { $in: ids } }); }
    await mongoose.disconnect();
  }
});
