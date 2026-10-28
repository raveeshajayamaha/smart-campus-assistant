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
router.get("/me", authenticate, (req, res) => res.json({ success: true, user: publicUser(req.user) }));
router.post("/logout", authenticate, async (req, res) => {
  await req.session.deleteOne();
  res.json({ success: true });
});
module.exports = router;
