const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const isEmail = existingUser.email === email;
      const isUsername = existingUser.username === username;

      const msg = isEmail && isUsername
        ? "Username and email already taken"
        : isEmail
        ? "Email already registered"
        : "Username already taken";

      return res.status(400).json({ error: msg });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "User registered", token });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // ✅ Include username and email in token
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
