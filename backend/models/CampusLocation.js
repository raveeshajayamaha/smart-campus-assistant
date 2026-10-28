const mongoose = require("mongoose");
module.exports = mongoose.model("CampusLocation", new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  building: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  openingHours: { type: String, required: true, trim: true },
  directions: { type: String, required: true, trim: true }
}, { timestamps: true }));
