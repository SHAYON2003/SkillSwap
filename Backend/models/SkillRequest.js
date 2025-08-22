
const mongoose = require('mongoose')

const skillLevelEnum = ["Beginner", "Intermediate", "Expert"];

const skillRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // post type
  type: { type: String, enum: ["offer", "learn", "direct"], required: true },

  // visibility helper
  visibility: { type: String, enum: ["public", "direct"], default: "direct" },

  // status (now includes completed)
  status: {
    type: String,
    enum: ["pending", "open", "accepted", "rejected", "cancelled", "completed"], // ⬅ added "completed"
    default: "pending",
  },

  // skills
  skillOffered: {
    name: { type: String, default: "" },
    level: { type: String, enum: skillLevelEnum, default: "Beginner" },
  },
  skillRequested: {
    name: { type: String, default: "" },
    level: { type: String, enum: skillLevelEnum, default: "Beginner" },
  },

  // when marked completed
  completedAt: { type: Date }, // ⬅ added timestamp
}, { timestamps: true });

module.exports = mongoose.model("SkillRequest", skillRequestSchema);
