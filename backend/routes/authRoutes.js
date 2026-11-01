const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const User = require("../models/User");
const Session = require("../models/Session");
const { authenticate, hashToken, publicUser } = require("../middleware/auth");
const router = express.Router();
const emailQuery = email => ({ email: { $regex: "^" + email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" } });
function credentials(body) {
  return typeof body?.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) && typeof body.password === "string" && body.password.length > 0 && body.password.length <= 72;
}
router.post("/register", async (req, res) => {
  if (!credentials(req.body) || typeof req.body.name !== "string" || !req.body.name.trim() || req.body.password.length < 6) return res.status(400).json({ success: false, message: "Provide name, valid email and a password of 6 to 72 characters" });
  const email = req.body.email.trim().toLowerCase();
  if (await User.findOne(emailQuery(email))) return res.status(400).json({ success: false, message: "User already exists" });
  const user = await User.create({ name: req.body.name.trim(), email, password: await bcrypt.hash(req.body.password, 10), role: "student" });
  res.status(201).json({ success: true, message: "User registered successfully", user: publicUser(user) });
});
router.post("/login", async (req, res) => {
  if (!credentials(req.body)) return res.status(400).json({ success: false, message: "Provide a valid email and password" });
  const user = await User.findOne(emailQuery(req.body.email));
  if (!user || !await bcrypt.compare(req.body.password, user.password)) return res.status(400).json({ success: false, message: "Invalid email or password" });
  const token = crypto.randomBytes(32).toString("hex");
  await Session.create({ tokenHash: hashToken(token), user: user._id, expiresAt: new Date(Date.now() + 86400000) });
  res.json({ success: true, message: "Login successful", token, user: publicUser(user) });
});
router.put("/change-password", authenticate, async (req, res) => {
  const body = req.body;
  const allowed = ["currentPassword", "newPassword", "confirmPassword"];
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) {
    return res.status(400).json({ success: false, message: "Only current password, new password and confirmation are accepted." });
  }
  if (allowed.some(key => typeof body[key] !== "string" || !body[key].length)) {
    return res.status(400).json({ success: false, message: "All password fields are required." });
  }
  const { currentPassword, newPassword, confirmPassword } = body;
  // Do not trim passwords: spaces are part of existing login credentials.
  if (currentPassword.length > 72 || newPassword.length < 6 || newPassword.length > 72 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return res.status(400).json({ success: false, message: "New password must be 6 to 72 characters and no more than 72 UTF-8 bytes. Current password must not exceed 72 characters." });
  }
  if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: "New password and confirmation do not match." });
  if (!await bcrypt.compare(currentPassword, req.user.password)) {
    return res.status(400).json({ success: false, message: "Current password is incorrect." });
  }
  if (await bcrypt.compare(newPassword, req.user.password)) {
    return res.status(400).json({ success: false, message: "New password must be different from your current password." });
  }
  const password = await bcrypt.hash(newPassword, 10);
  // Revoke sessions before writing so a revocation failure cannot leave a changed
  // password with valid old sessions. The hash condition prevents stale writes.
  await Session.deleteMany({ user: req.user._id });
  const result = await User.updateOne({ _id: req.user._id, password: req.user.password }, { $set: { password } }, { runValidators: true });
  if (!result.modifiedCount) return res.status(400).json({ success: false, message: "Your password changed during this request. Please sign in again." });
  res.json({ success: true, message: "Password changed successfully. Please sign in with your new password." });
});
// Only explicitly allowed fields on the authenticated user can be updated.
router.put("/profile", authenticate, async (req, res) => {
  const limits = { name: 120, studentId: 60, faculty: 120, department: 120, yearSemester: 60, contactNumber: 40 };
  const labels = { name: "Full Name", studentId: "Student ID", faculty: "Faculty", department: "Department", yearSemester: "Year/Semester", contactNumber: "Contact Number" };
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length) {
    return res.status(400).json({ success: false, message: "Provide profile fields to update." });
  }
  if (Object.keys(body).some(field => !Object.hasOwn(limits, field))) {
    return res.status(400).json({ success: false, message: "Only name, student ID, faculty, department, year/semester and contact number can be updated." });
  }
  const updates = {};
  const errors = {};
  for (const field of Object.keys(body)) {
    const value = body[field];
    if (typeof value !== "string") {
      errors[field] = `${labels[field]} must be text.`;
      continue;
    }
    const trimmed = value.trim();
    if (field === "name" && !trimmed) errors[field] = "Full Name is required.";
    else if (trimmed.length > limits[field]) errors[field] = `${labels[field]} must be ${limits[field]} characters or fewer.`;
    else if (Array.from(trimmed).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) errors[field] = `${labels[field]} must not contain control characters.`;
    else if (field === "contactNumber" && trimmed && (!/^[+0-9(). -]{3,40}$/.test(trimmed) || !/\d/.test(trimmed))) {
      errors[field] = "Contact Number must contain digits and may include +, spaces, parentheses, dots or hyphens.";
    }
    else updates[field] = trimmed;
  }
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: Object.values(errors).join(" "), errors });
  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { returnDocument: "after", runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: "Your account could not be found." });
  res.json({ success: true, message: "Profile updated successfully.", user: publicUser(user) });
});
router.get("/me", authenticate, (req, res) => res.json({ success: true, user: publicUser(req.user) }));
router.post("/logout", authenticate, async (req, res) => {
  await req.session.deleteOne();
  res.json({ success: true });
});
module.exports = router;
