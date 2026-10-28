const mongoose = require("mongoose");
module.exports = async () => {
  if (!process.env.MONGO_URI) throw new Error("Set MONGO_URI in backend/.env");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, ...(process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {}) });
  console.log("MongoDB connected successfully");
};
