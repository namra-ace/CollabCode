require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const archiver = require("archiver");
const mongoose = require("mongoose");

const codeSocket = require("./sockets/codeSocket");
const authRoutes = require("./routes/authRoutes");
const optionallyVerifyToken = require("./middleware/optionallyVerifyToken");
const authenticateJWT = require('./middleware/authenticateJWT');

const Project = require("./models/Project");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
];

// Middleware: JSON and CORS
app.use(express.json());
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://codesync-ten-mu.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});


// Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Database connection error:", err));

// Routes
app.use("/api/auth", authRoutes);

// Create Room
app.post("/api/create-room", async (req, res) => {
  try {
    const { roomId, title } = req.body;
    if (!roomId) return res.status(400).json({ error: "Missing roomId" });

    const exists = await Project.findOne({ roomId });
    if (exists) return res.status(400).json({ error: "Room already exists" });

    const newProject = new Project({
      roomId,
      title: title || "",
      createdAt: new Date(),
      files: {},
      structure: { type: "folder", name: "root", children: [] },
    });

    await newProject.save();
    res.status(201).json({ message: "Room created" });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// Save Project
app.post("/api/save", optionallyVerifyToken, async (req, res) => {
  const { roomId, files, structure, title } = req.body;
  if (!roomId || !files || !structure)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const project = await Project.findOneAndUpdate(
      { roomId },
      {
        files,
        structure,
        title,
        createdBy: req.user?.id || null,
      },
      { upsert: true, new: true }
    );

    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { visitedRooms: roomId },
      });
    }

    res.json({ message: "Project saved" });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save project" });
  }
});

//Delete room for user
app.delete("/api/my-rooms/:roomId", authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  const { roomId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.visitedRooms = user.visitedRooms.filter((id) => id !== roomId);
    await user.save();

    res.json({ message: "Room removed from visited list" });
  } catch (err) {
    console.error("❌ Delete visited room error:", err);
    res.status(500).json({ error: "Failed to remove room" });
  }
});


// Load Project
app.get("/api/room/:roomId", optionallyVerifyToken, async (req, res) => {
  try {
    const project = await Project.findOne({ roomId: req.params.roomId });
    if (!project) return res.status(404).json({ error: "Room not found" });

    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { visitedRooms: req.params.roomId },
      });
    }

    res.json(project);
  } catch (err) {
    console.error("Load error:", err);
    res.status(500).json({ error: "Failed to load project" });
  }
});

// Download as ZIP
app.get("/api/download/:roomId", async (req, res) => {
  try {
    const project = await Project.findOne({ roomId: req.params.roomId });
    if (!project) return res.status(404).json({ error: "Room not found" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=${req.params.roomId}.zip`,
    });

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const addFiles = (structure, basePath = "") => {
      for (const node of structure) {
        const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
        if (node.type === "file") {
          const content = project.files[fullPath] || "";
          archive.append(content, { name: fullPath });
        } else if (node.type === "folder") {
          addFiles(node.children, fullPath);
        }
      }
    };

    addFiles(project.structure.children);
    archive.finalize();
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Failed to download zip" });
  }
});

// Get User Rooms
app.get("/api/my-rooms", optionallyVerifyToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const rooms = await Project.find(
      { roomId: { $in: user.visitedRooms } },
      "roomId createdAt title"
    );

    res.json(rooms);
  } catch (err) {
    console.error("Fetch my rooms error:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// Get Authenticated User Info
app.get("/api/me", authenticateJWT, (req, res) => {
  res.json({ username: req.user.username, email: req.user.email });
});

// Socket.io Handling
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);
  codeSocket(socket, io);
});

// Default Health Check
app.get("/", (req, res) => res.send("🚀 Server running"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
