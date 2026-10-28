require("dotenv").config({ path: require("node:path").join(__dirname, ".env"), quiet: true });
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
(async () => {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Usage: npm run make-admin -- your-email@example.com");
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { returnDocument: "after", runValidators: true });
  if (!user) throw new Error("Register this email before promoting it");
  console.log("Administrator role granted. Log in again.");
})().catch(error => { console.error(error.message.startsWith("Usage:") || error.message.startsWith("Register") ? error.message : "Could not update administrator. Check MongoDB configuration."); process.exitCode = 1; }).finally(() => mongoose.disconnect());
