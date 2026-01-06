const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    files: { type: Object, required: true },
    structure: { type: Object, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now},
    title: { type: String, default: "" },
    passcode: { type: String, required: true },
    // ✅ NEW: Store IDs of users who have edit access
    editors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }], 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);