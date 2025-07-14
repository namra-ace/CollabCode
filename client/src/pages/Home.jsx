import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { motion } from "framer-motion";
import { Code2, Clock } from "lucide-react";

// ✅ Environment-based backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, token } = useAuth();
  const [visitedRooms, setVisitedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    const fetchVisitedRooms = async () => {
      if (!isAuthenticated) {
        setVisitedRooms([]);
        setLoadingRooms(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/my-rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setVisitedRooms(data);
        else console.error("Error fetching rooms:", data.error);
      } catch (err) {
        console.error("Fetch error:", err.message);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchVisitedRooms();
  }, [isAuthenticated, token]);

  const handleCreateRoom = async () => {
    const newRoomId = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: "-",
      length: 3,
    });
    try {
      const res = await fetch(`${BACKEND_URL}/api/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: newRoomId }),
      });
      const data = await res.json();
      if (res.ok) navigate(`/room/${newRoomId}`);
      else alert(`❌ ${data.error}`);
    } catch (err) {
      alert("🚨 Failed to create room. Try again.");
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) navigate(`/room/${roomId}`);
  };

  const handleDeleteRoom = async (roomIdToDelete) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/my-rooms/${roomIdToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setVisitedRooms((prev) =>
          prev.filter((room) => room.roomId !== roomIdToDelete)
        );
      } else {
        const data = await res.json();
        alert(`❌ Failed to remove room: ${data.error}`);
      }
    } catch (err) {
      alert("🚨 Couldn't remove room. Try again.");
      console.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white font-sans">
      <div className="flex-grow px-4 py-10 max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-cyan-400">🚀 CodeSync</h1>
          <div className="space-x-4">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Register
                </button>
              </>
            ) : (
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              >
                Logout
              </button>
            )}
          </div>
        </header>

        {isAuthenticated && user?.username && (
          <p className="mb-6 text-xl text-center">
            👋 Welcome back,{" "}
            <span className="text-yellow-300 font-semibold">
              {user.username}
            </span>
          </p>
        )}

        <section className="flex flex-col md:flex-row items-center gap-6 mb-12">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-2 w-full md:w-80 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring focus:ring-cyan-500"
          />
          <button
            onClick={handleJoinRoom}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 w-full md:w-auto"
          >
            🔗 Join Room
          </button>
          <button
            onClick={handleCreateRoom}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 w-full md:w-auto"
          >
            ➕ Create Room
          </button>
        </section>

        {isAuthenticated && (
          <section>
            <h2 className="text-2xl font-bold mb-4">🕘 Recently Visited</h2>
            {loadingRooms ? (
              <p>Loading...</p>
            ) : visitedRooms.length === 0 ? (
              <p className="text-gray-400">No visited rooms yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {visitedRooms.map((room, idx) => (
                  <motion.div
                    key={room.roomId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative p-5 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-lg hover:shadow-2xl transition duration-300"
                  >
                    <div
                      onClick={() => navigate(`/room/${room.roomId}`)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Code2 size={20} className="text-cyan-300" />
                        <h3 className="text-lg font-semibold text-cyan-300 truncate">
                          {room.title || room.roomId}
                        </h3>
                      </div>
                      {room.title && (
                        <p className="text-sm text-gray-300 truncate">
                          ID: {room.roomId}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-gray-400 text-xs">
                        <Clock size={14} />
                        <span>
                          {new Date(room.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.roomId);
                      }}
                      title="Remove from history"
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                    >
                      ✖
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="text-center text-gray-500 text-sm py-4 border-t border-gray-800">
        🚀 Made with ❤️ by{" "}
        <span className="text-cyan-400 font-medium">Namra</span>
      </footer>
    </div>
  );
}

export default Home;
