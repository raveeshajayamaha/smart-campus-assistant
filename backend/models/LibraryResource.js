const mongoose = require("mongoose");
module.exports = mongoose.model("LibraryResource", new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  availability: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  link: { type: String, default: "", validate: { validator: v => !v || /^https?:\/\/[^\s]+$/i.test(v), message: "Use an HTTP or HTTPS link" } }
}, { timestamps: true }));
