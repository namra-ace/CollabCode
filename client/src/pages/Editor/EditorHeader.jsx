import { useState } from "react";
import { FaHome, FaSave, FaDownload, FaCopy, FaRobot, FaTimes, FaMagic } from "react-icons/fa";
import toast from "react-hot-toast";

function EditorHeader({
  title,
  setTitle,
  onSave,
  roomId,
  navigate,
  backendUrl,
  activeFile,
  codeContent,
  onApplySuggestion // 👈 New Handler
}) {
  // AI State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 1. Fetch AI
  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return toast.error("Please enter a question");
    if (!activeFile) return toast.error("Open a file first");

    setIsAiLoading(true);
    setAiResponse("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          code: codeContent,
          prompt: aiPrompt,
          language: activeFile.split('.').pop()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAiResponse(data.result);
      } else {
        toast.error(data.error || "AI failed to respond");
      }
    } catch (err) {
      toast.error("Failed to connect to AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  // 2. Insert Handler
  const handleInsert = () => {
    if (!aiResponse) return;
    onApplySuggestion(aiResponse); // Calls parent to clean & insert
    setIsAiOpen(false); // Close modal
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <input
          className="flex-grow px-4 py-2 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white shadow-inner"
          placeholder="📝 Project title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex gap-2">
          {/* 🤖 AI Button */}
          <button
            onClick={() => setIsAiOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg shadow-sm text-white transition-colors"
            title="Ask AI"
          >
            <FaRobot />
          </button>

          <button onClick={() => navigate("/")} className="bg-yellow-500 hover:bg-yellow-600 p-2 rounded-lg text-black">
            <FaHome />
          </button>
          <button onClick={onSave} className="bg-green-500 hover:bg-green-600 p-2 rounded-lg text-white">
            <FaSave />
          </button>
          <button
            onClick={() => {
                roomId && navigator.clipboard.writeText(roomId).then(() => toast.success("Copied!"));
            }}
            className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-lg text-white"
          >
            <FaCopy />
          </button>
          <button
            onClick={() => roomId && window.open(`${backendUrl}/api/download/${roomId}`, "_blank")}
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg text-white"
          >
            <FaDownload />
          </button>
        </div>
      </div>

      {/* 🤖 AI Modal */}
      {isAiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800 rounded-t-xl">
              <h3 className="text-white font-bold flex items-center gap-2">
                <FaRobot className="text-purple-400"/> AI Assistant
              </h3>
              <button onClick={() => setIsAiOpen(false)} className="text-gray-400 hover:text-white">
                <FaTimes />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-gray-300 space-y-4">
              <div className="text-xs text-gray-500">
                Context: <span className="text-purple-400">{activeFile}</span>
              </div>
              
              {aiResponse ? (
                <div className="bg-black/30 p-3 rounded border border-gray-700/50 whitespace-pre-wrap leading-relaxed font-mono text-sm">
                  {aiResponse}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">Enter a prompt to analyze code</div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl flex flex-col gap-3">
              {/* ✨ Insert Button */}
              {aiResponse && (
                 <div className="flex justify-end pb-2">
                    <button 
                      onClick={handleInsert}
                      className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition"
                    >
                      <FaMagic /> Insert at Cursor
                    </button>
                 </div>
              )}

              <div className="flex gap-3">
                <input 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isAiLoading && handleAskAI()}
                  placeholder="Ask about your code..."
                  className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
                <button 
                  onClick={handleAskAI}
                  disabled={isAiLoading}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white font-medium disabled:opacity-50"
                >
                  {isAiLoading ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EditorHeader;