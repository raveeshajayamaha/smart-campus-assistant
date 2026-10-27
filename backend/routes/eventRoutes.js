const express = require("express");
const Event = require("../models/event");

const router = express.Router();

// Add a new event
router.post("/", async (req, res) => {
  try {
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    const invalid = error.name === "ValidationError" || error.name === "CastError";
    res.status(invalid ? 400 : 500).json({
      success: false,
      message: invalid ? "Please provide valid title, date, time, and location." : "Failed to create event",
    });
  }
});

// Get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get events",
    });
  }
});

module.exports = router;