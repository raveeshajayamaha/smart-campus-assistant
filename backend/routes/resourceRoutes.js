const express = require("express");
const mongoose = require("mongoose");
const { authenticate, admin } = require("../middleware/auth");
module.exports = function resourceRoutes(Model, plural, singular, sort = { createdAt: -1 }, publicRead = false) {
  const router = express.Router();
  const fields = Object.keys(Model.schema.paths).filter(k => !["_id", "__v", "createdAt", "updatedAt"].includes(k));
  const clean = body => Object.fromEntries(Object.entries(body || {}).filter(([k]) => fields.includes(k)));
  router.get("/", ...(publicRead ? [] : [authenticate]), async (req, res) => {
    res.json({ success: true, [plural]: await Model.find().sort(sort) });
  });
  router.use(authenticate, admin);
  router.post("/", async (req, res) => {
    const record = await Model.create(clean(req.body));
    res.status(201).json({ success: true, [singular]: record });
  });
  router.use("/:id", (req, res, next) => {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ success: false, message: "Invalid record ID" });
    next();
  });
  router.put("/:id", async (req, res) => {
    const record = await Model.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    const data = clean(req.body);
    if (!Object.keys(data).length) return res.status(400).json({ success: false, message: "Provide fields to update" });
    record.set(data);
    await record.save();
    res.json({ success: true, [singular]: record });
  });
  router.delete("/:id", async (req, res) => {
    const record = await Model.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true });
  });
  return router;
};
