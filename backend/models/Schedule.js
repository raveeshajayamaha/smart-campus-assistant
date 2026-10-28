const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  location: { type: String, required: true, trim: true },
  type: { type: String, default: "Lecture" }
}, { timestamps: true });
schema.pre("validate", function () {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) this.invalidate("endTime", "End time must be after start time");
});
module.exports = mongoose.model("Schedule", schema);
