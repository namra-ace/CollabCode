const jwt = require("jsonwebtoken");
const roomFileMap = {}; // roomId => { files, structure }
const activeUsersMap = {}; // roomId => [{ id, username }]
const Project = require("../models/Project");

module.exports = (socket, io) => {
  socket.on("join-room", async (roomId, user) => {
    try {
      const roomExits = await Project.findOne({ roomId });

      if (!roomExits) {
        console.warn(`Room ${roomId} does not exist`);
        socket.emit("room-error", { message: "Room does not exist" });
        return;
      }

      socket.join(roomId);

      let username = "Guest";
      if (user?.token) {
        try {
          const decoded = jwt.verify(user.token, process.env.JWT_SECRET);
          username = decoded.username || "Guest";
        } catch (err) {
          console.warn("Invalid token in join-room:", err.message);
        }
      } else if (user?.username) {
        username = user.username;
      }

      socket.data.username = username;

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

  // socket.on("code-change", ({ roomId, filePath, code }) => {
  //   if (!roomFileMap[roomId])
  //     roomFileMap[roomId] = { files: {}, structure: {} };
  //   roomFileMap[roomId].files[filePath] = code;
  //   socket.to(roomId).emit("code-change", { filePath, code });
  // });

  // ✅ Fixed: Include sender in structure-update
  socket.on("structure-update", ({ roomId, structure, files, sender }) => {
    io.to(roomId).emit("structure-update", { structure, files, sender });
  });

  socket.on("disconnect", () => {
    for (const roomId in activeUsersMap) {
      activeUsersMap[roomId] = activeUsersMap[roomId].filter(
        (user) => user.id !== socket.id
      );
      io.to(roomId).emit("active-users-update", activeUsersMap[roomId]);
    }
    console.log("User disconnected:", socket.id);
  });
};
