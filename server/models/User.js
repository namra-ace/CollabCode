const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    visitedRooms: {
      type: [String],
      default: [],
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
