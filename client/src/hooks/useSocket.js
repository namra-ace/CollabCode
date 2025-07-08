import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const useSocket = (roomId) => {
  const socketRef = useRef();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!roomId) return;

    const socket = io(API_BASE, { reconnection: true });
    socketRef.current = socket;

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Guest";

    socket.on("connect", () => {
      socket.emit("join-room", roomId, { username, token });
    });

    socket.on("room-error", (err) => {
      alert(err.message || "Room join failed");
      navigate("/");
    });

    return () => socket.disconnect();
  }, [roomId]);

  return socketRef;
};

export default useSocket;
