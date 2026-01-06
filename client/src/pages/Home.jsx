import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Clock, Copy, Check, X } from "lucide-react";
import toast from "react-hot-toast"; // ✅ Import toast hook only

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [passcode, setPasscode] = useState(""); 
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, token } = useAuth();
  const [visitedRooms, setVisitedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // State for Success Modal
  const [newRoomData, setNewRoomData] = useState(null); 
  const [isCopied, setIsCopied] = useState(false);

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
    if (!isAuthenticated) {
      toast.error("Please login to create a room!");
      navigate("/login");
      return;
    }

    const newRoomId = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: "-",
      length: 3,
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/create-room`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ roomId: newRoomId }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setNewRoomData({ roomId: newRoomId, passcode: data.passcode });
        toast.success("Room Created Successfully!");
      } else {
        toast.error(data.error || "Failed to create room");
      }
    } catch (err) {
      toast.error("🚨 Failed to create room. Try again.");
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`, { 
        state: { passcode: passcode.trim() } 
      });
    } else {
      toast.error("Please enter a Room ID");
    }
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
        toast.success("Room removed from history");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove room");
      }
    } catch (err) {
      toast.error("🚨 Couldn't remove room. Try again.");
      console.error(err.message);
    }
  };

  const copyPasscode = () => {
    if (newRoomData?.passcode) {
      navigator.clipboard.writeText(newRoomData.passcode);
      setIsCopied(true);
      toast.success("Passcode copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black to-gray-900 text-white font-sans relative">
      {/* ❌ No <Toaster /> here, it is in main.jsx */}

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

        <section className="flex flex-col md:flex-row items-center gap-4 mb-12 justify-center">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-2 w-full md:w-64 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring focus:ring-cyan-500"
          />
          
          <input
            type="text"
            placeholder="Passcode (Optional)"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            maxLength={4}
            className="px-4 py-2 w-full md:w-40 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring focus:ring-cyan-500 text-center tracking-widest"
          />

          <button
            onClick={handleJoinRoom}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 w-full md:w-auto font-semibold"
          >
            🔗 Join
          </button>
          
          <button
            onClick={handleCreateRoom}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 w-full md:w-auto font-semibold"
          >
            ➕ Create
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

      {/* Success Modal */}
      <AnimatePresence>
        {newRoomData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative"
            >
              <button
                onClick={() => setNewRoomData(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Room Created!</h2>
                <p className="text-gray-400 mb-6">
                  Your room is ready. Share this passcode to allow others to edit.
                </p>

                <div className="bg-black/40 p-4 rounded-xl border border-gray-700 mb-6 flex flex-col items-center">
                  <span className="text-sm text-gray-500 uppercase tracking-widest mb-1">Passcode</span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-mono font-bold text-cyan-400 tracking-widest">
                      {newRoomData.passcode}
                    </span>
                    <button
                      onClick={copyPasscode}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group relative"
                      title="Copy Passcode"
                    >
                      {isCopied ? (
                        <Check size={20} className="text-green-400" />
                      ) : (
                        <Copy size={20} className="text-gray-400 group-hover:text-white" />
                      )}
                    </button>
                  </div>
                  {isCopied && <span className="text-green-400 text-xs mt-2">Copied!</span>}
                </div>

                <button
                  onClick={() => navigate(`/room/${newRoomData.roomId}`, { state: { passcode: newRoomData.passcode } })}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white shadow-lg hover:shadow-cyan-500/20 transition-all hover:scale-[1.02]"
                >
                  Enter Room 🚀
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;