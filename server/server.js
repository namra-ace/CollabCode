require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { WebSocketServer } = require("ws");
const { setupWSConnection } = require("./yjsUtils");
const archiver = require("archiver");
const codeSocket = require("./sockets/codeSocket");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes"); 
const optionallyVerifyToken = require("./middleware/optionallyVerifyToken");
const authenticateJWT = require("./middleware/authenticateJWT");

const Project = require("./models/Project");
const User = require("./models/User");

const app = express();
const server = http.createServer(app);

const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL];

// -------------------- Middleware --------------------
app.use(express.json());
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const wss = new WebSocketServer({ noServer: true });

// -------------------- WEBSOCKET UPGRADE HANDLER --------------------
server.on("upgrade", async (request, socket, head) => {
  if (request.url.startsWith("/yjs")) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get("token");
    const roomId = url.searchParams.get("roomId"); 

    let user = null;
    let hasWriteAccess = false;

    if (token) {
      try {
        const cleanToken = token.replace("Bearer ", "").replace(/['"]+/g, '').trim();
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        user = decoded;
      } catch (err) {}
    }

    if (roomId && user) {
      try {
        const project = await Project.findOne({ roomId });
        if (project) {
            const userId = user.id;
            const ownerId = project.createdBy ? project.createdBy.toString() : "null";
            const editors = project.editors.map(id => id.toString());
            const isOwner = ownerId === userId;
            const isEditor = editors.includes(userId);

            if (isOwner || isEditor) {
                hasWriteAccess = true;
                if (isOwner && !isEditor) {
                    await Project.updateOne({ _id: project._id }, { $addToSet: { editors: userId } });
                }
            }
        }
      } catch (err) { console.error("RBAC Error:", err); }
    }

    request.readOnly = !hasWriteAccess;
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});

wss.on("connection", (ws, req) => {
  const docName = req.url.substring(1).split("?")[0];
  setupWSConnection(ws, req, { docName, readOnly: req.readOnly });
});

// -------------------- MongoDB --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Database connection error:", err));

// -------------------- Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes); 

// ... existing imports

// 1. Create Room (Clean Version)
app.post("/api/create-room", authenticateJWT, async (req, res) => {
  try {
    const { roomId, title } = req.body;
    if (!roomId) return res.status(400).json({ error: "Room ID is required" });

    const exists = await Project.findOne({ roomId });
    if (exists) return res.status(400).json({ error: "Room already exists" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found. Relogin required." });

    const passcode = Math.floor(1000 + Math.random() * 9000).toString();

    // 🔴 CHANGE IS HERE
    const newProject = new Project({
      roomId,
      title: title || "Untitled",
      
      // 1. Empty Files Object (No README)
      files: {}, 
      
      // 2. Empty Root Folder (Valid Structure)
      structure: { 
          type: "folder", 
          name: "root", 
          children: [] // No children initially
      },
      
      createdBy: req.user.id,
      passcode: passcode,
      editors: [req.user.id],
    });

    await newProject.save();
    
    user.visitedRooms.addToSet(roomId);
    await user.save();

    res.status(201).json({ message: "Room created", passcode });
  } catch (err) {
    console.error("Create Room Error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});


// 2. Verify Passcode
app.post("/api/verify-passcode", authenticateJWT, async (req, res) => {
  const { roomId, passcode } = req.body;
  try {
    const project = await Project.findOne({ roomId });
    if (!project) return res.status(404).json({ error: "Room not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (project.createdBy.toString() === req.user.id) {
       await Project.updateOne({ roomId }, { $addToSet: { editors: req.user.id } });
       return res.json({ message: "Access granted", role: "owner" });
    }

    if (project.passcode === passcode) {
      await Project.updateOne({ roomId }, { $addToSet: { editors: req.user.id } });
      user.visitedRooms.addToSet(roomId);
      await user.save();
      return res.json({ message: "Access granted", role: "editor" });
    } else {
      return res.status(403).json({ error: "Incorrect passcode" });
    }
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// 3. Save Project
app.post("/api/save", optionallyVerifyToken, async (req, res) => {
  const { roomId, files, structure, title } = req.body;
  try {
    await Project.findOneAndUpdate(
      { roomId },
      { files, structure, title },
      { upsert: true, new: true }
    );
    if (req.user) {
       await User.findByIdAndUpdate(req.user.id, { $addToSet: { visitedRooms: roomId } });
    }
    res.json({ message: "Project saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save project" });
  }
});

// 4. Get Room (This was missing!)
app.get("/api/room/:roomId", optionallyVerifyToken, async (req, res) => {
  try {
    const project = await Project.findOne({ roomId: req.params.roomId });
    if (!project) return res.status(404).json({ error: "Room not found" });

    if (req.user) {
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { visitedRooms: req.params.roomId } });
    }

    const projectData = project.toObject();
    const userId = req.user ? req.user.id : null;
    const isOwner = userId && project.createdBy && project.createdBy.toString() === userId;
    const isEditor = userId && project.editors.some(id => id.toString() === userId);

    if (!isOwner) delete projectData.passcode;
    projectData.isOwner = isOwner;
    projectData.canEdit = isOwner || isEditor; 

    res.json(projectData);
  } catch (err) {
    res.status(500).json({ error: "Failed to load project" });
  }
});

// 5. Get My Rooms (Robust)
app.get("/api/my-rooms", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found. Relogin required." });

    const rooms = await Project.find(
        { roomId: { $in: user.visitedRooms } }, 
        "roomId createdAt title"
    );
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// 6. Delete Room
app.delete("/api/my-rooms/:roomId", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.visitedRooms = user.visitedRooms.filter(id => id !== req.params.roomId);
    await user.save();
    res.json({ message: "Room removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove room" });
  }
});

// 7. Download Project
// server/server.js

app.get("/api/download/:roomId", async (req, res) => {
  try {
    const project = await Project.findOne({ roomId: req.params.roomId });
    if (!project) return res.status(404).send("Room not found");

    const archive = archiver("zip", { zlib: { level: 9 } });

    // Handle errors explicitly to prevent server crashes
    archive.on('error', function(err) {
      throw err;
    });

    // Set headers
    const filename = `${project.title || "project"}.zip`;
    res.attachment(filename);
    archive.pipe(res);

    // Recursive function with Safety Checks 🛡️
    const addFiles = (nodes, parentPath) => {
      if (!Array.isArray(nodes)) return; // Stop if nodes is not an array

      nodes.forEach((node) => {
        const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        
        if (node.type === "file") {
          // Files are stored with leading slash: "/root/src/App.jsx"
          // We assume "root" is the top folder in your structure.
          // If your DB keys look like "/src/App.jsx", adjust the lookup below.
          
          // Try both with and without leading slash to be safe
          const fileKey = `/${currentPath}`; 
          const fileData = project.files[fileKey] || project.files[currentPath];
          
          if (fileData) {
             archive.append(fileData.value || "", { name: currentPath });
          } else {
             // Optional: Create empty file if content missing
             archive.append("", { name: currentPath });
          }

        } else if (node.type === "folder") {
          // Create the folder in the zip
          archive.append(null, { name: currentPath + "/" });
          
          // CRASH FIX: Ensure children exists before recursing
          addFiles(node.children || [], currentPath);
        }
      });
    };

    // Start from the root children
    if (project.structure && project.structure.children) {
      addFiles(project.structure.children, "");
    }

    await archive.finalize();

  } catch (err) {
    console.error("❌ ZIP Generation Error:", err); // Check your terminal for this!
    if (!res.headersSent) {
      res.status(500).send("Failed to zip project");
    }
  }
});

app.get("/api/me", authenticateJWT, (req, res) => {
  res.json({ username: req.user.username, email: req.user.email, id: req.user.id });
});

io.on("connection", (socket) => codeSocket(socket, io));
app.get("/", (_, res) => res.send("🚀 Server running"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));