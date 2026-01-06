const jwt = require("jsonwebtoken");
const roomFileMap = {}; 
const activeUsersMap = {}; 
const Project = require("../models/Project");

module.exports = (socket, io) => {
  socket.on("join-room", async (roomId, user) => {
    try {
      const project = await Project.findOne({ roomId });

      if (!project) {
        socket.emit("room-error", { message: "Room does not exist" });
        return;
      }

      socket.join(roomId);

      let username = "Guest";
      let userId = null;
      let hasWriteAccess = false;
      let role = "Guest";

      // 1. Verify Token
      if (user?.token) {
        try {
          const cleanToken = user.token.replace("Bearer ", "").replace(/['"]+/g, '').trim();
          
          const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
          username = decoded.username || "Guest";
          userId = decoded.id;
        } catch (err) {
          // Token verification failed, treat as Guest
        }
      } else if (user?.username) {
        username = user.username;
      }

      // 2. Check Permissions (Owner OR Editor in Array)
      if (userId) {
        const isOwner = project.createdBy && project.createdBy.toString() === userId;
        const isEditor = project.editors.some(id => id.toString() === userId);

        if (isOwner) role = "Owner";
        else if (isEditor) role = "Editor";

        if (isOwner || isEditor) {
          hasWriteAccess = true;
        }
      }

      socket.data.username = username;
      socket.data.hasWriteAccess = hasWriteAccess;

      if (!activeUsersMap[roomId]) activeUsersMap[roomId] = [];
      activeUsersMap[roomId].push({ id: socket.id, username });

      io.to(roomId).emit("active-users-update", activeUsersMap[roomId]);
    } catch (err) {
      console.error("Error joining room:", err.message);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("request-all-files", ({ roomId }) => {
    socket.to(roomId).emit("request-all-files", { requesterId: socket.id });
  });

  socket.on("send-all-files", ({ roomId, files, structure, to }) => {
    roomFileMap[roomId] = { files, structure };
    io.to(to).emit("load-all-files", { files, structure });
  });

  socket.on("structure-update", ({ roomId, structure, files, sender }) => {
    // RBAC CHECK: Block guests
    if (!socket.data.hasWriteAccess) {
      return;
    }
    io.to(roomId).emit("structure-update", { structure, files, sender });
  });

  socket.on("disconnect", () => {
    for (const roomId in activeUsersMap) {
      activeUsersMap[roomId] = activeUsersMap[roomId].filter(
        (user) => user.id !== socket.id
      );
      io.to(roomId).emit("active-users-update", activeUsersMap[roomId]);
    }
  });
};