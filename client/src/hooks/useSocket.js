import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

// ✅ Removed 'passcode' from arguments
const useSocket = (roomId, { token } = {}) => {
  const socketRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket"],
    });

    const effectiveToken = token || localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Guest";

    socketRef.current.on("room-error", (err) => {
      alert(err.message || "Something went wrong");
      navigate("/");
    });

    // ✅ Emitting only essential identity info
    // The server will look up permissions in the DB using the token (user ID)
    socketRef.current.emit("join-room", roomId, { 
      username, 
      token: effectiveToken 
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, navigate, token]); // ✅ Removed passcode dependency

  return socketRef;
};

export default useSocket;