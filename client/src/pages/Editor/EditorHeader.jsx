import { FaHome, FaSave, FaDownload, FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";

function EditorHeader({
  title,
  setTitle,
  onSave,
  roomId,
  navigate,
  backendUrl,
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <input
        className="flex-grow px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white shadow-inner"
        placeholder="📝 Project title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          onClick={() => navigate("/")}
          className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-lg shadow-sm text-black"
        >
          <FaHome />
        </button>

        <button
          onClick={onSave}
          className="bg-green-500 hover:bg-green-600 p-2 rounded-lg shadow-sm text-white"
        >
          <FaSave />
        </button>

        <button
          onClick={() => {
            if (roomId) {
              navigator.clipboard
                .writeText(roomId)
                .then(() => toast.success(`📋 Room ID "${roomId}" copied!`))
                .catch(() => toast.error("❌ Failed to copy Room ID"));
            } else {
              toast.error("⚠️ No Room ID found");
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg shadow-sm text-white"
          title={`Copy Room ID: ${roomId}`}
        >
          <FaCopy />
        </button>

        <button
          onClick={() =>
            roomId &&
            window.open(`${backendUrl}/api/download/${roomId}`, "_blank")
          }
          className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg shadow-sm text-white"
        >
          <FaDownload />
        </button>
      </div>
    </div>
  );
}

export default EditorHeader;
