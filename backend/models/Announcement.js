const mongoose = require("mongoose");
module.exports = mongoose.model("Announcement", new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, default: "General" },
  date: { type: Date, required: true },
  priority: { type: String, enum: ["normal", "high", "urgent"], default: "normal" }
}, { timestamps: true }));
