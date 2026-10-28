const crypto = require("node:crypto");
const Session = require("../models/Session");
const hashToken = token => crypto.createHash("sha256").update(token).digest("hex");
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role });
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return res.status(401).json({ success: false, message: "Please log in" });
  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).populate("user");
  if (!session?.user) return res.status(401).json({ success: false, message: "Session expired. Please log in again" });
  req.user = session.user;
  req.session = session;
  next();
}
function admin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Administrator access required" });
  next();
}
module.exports = { authenticate, admin, hashToken, publicUser };
