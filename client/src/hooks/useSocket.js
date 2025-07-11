import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const useSocket = (roomId) => {
  const socketRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket"],
    });

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Guest";

    socketRef.current.on("room-error", (err) => {
      alert(err.message || "Something went wrong");
      navigate("/");
    });

    socketRef.current.emit("join-room", roomId, { username, token });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, navigate]);

  return socketRef;
};

export default useSocket;
