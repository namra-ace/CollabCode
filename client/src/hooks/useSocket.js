import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom'; // ⬅️ Add this

const useSocket = (roomId) => {
  const socketRef = useRef();
  const navigate = useNavigate(); // ⬅️ Add this

  useEffect(() => {
    if (!roomId) return;

    socketRef.current = io('http://localhost:5000');

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Guest";

    // 💥 Proper handling of room-error
    socketRef.current.on("room-error", (err) => {
      alert(err.message || "Something went wrong");
      navigate("/"); // or navigate("/error-page") if you have one
    });

    socketRef.current.emit("join-room", roomId, { username, token });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, navigate]);

  return socketRef;
};

export default useSocket;
