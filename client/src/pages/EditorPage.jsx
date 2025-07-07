import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaHome, FaSave, FaDownload } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import CodeEditor from "../components/CodeEditor";
import Spinner from "../components/Spinner";
import ProjectSidebar from "../components/ProjectSidebar";
import useSocket from "../hooks/useSocket";
import useEditorSync from "../hooks/useEditorSync";
import { useAuth } from "../context/AuthContext";

import {
  handleFileClick,
  handleDeleteNode,
  handleRenameNode,
} from "./EditorPageParts/FileOperations";

import {
  getLanguageFromExtension,
  handleAddNode,
} from "./EditorPageParts/structureOperations";

const API_BASE = import.meta.env.VITE_API_URL;

function EditorPage() {
  const { token } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket(roomId);

  const [activeUsers, setActiveUsers] = useState([]);
  const [title, setTitle] = useState("");
  const [fileLanguage, setFileLanguage] = useState({});
  const [projectstructure, setProjectStructure] = useState({
    type: "folder",
    name: "root",
    children: [],
  });
  const [fileContent, setFileContent] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);
  const [openTabs, setOpenTabs] = useState([]);

  const handleSave = async () => {
    if (!roomId) return toast.error("No room ID");
    try {
      const res = await fetch(`${API_BASE}/api/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          roomId,
          files: fileContent,
          structure: projectstructure,
          title,
        }),
      });
      res.ok
        ? toast.success("✅ Project saved")
        : toast.error(`❌ ${await res.text()}`);
    } catch (err) {
      toast.error(`⚠️ Save error: ${err.message}`);
    }
  };

  const syncToDB = () => {
    if (!roomId || !hasLoadedFiles) return;
    fetch(`${API_BASE}/api/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        roomId,
        files: fileContent,
        structure: projectstructure,
        title,
      }),
    }).catch((err) => console.error("DB Sync Failed", err));
  };

  useEditorSync({
    roomId,
    socketRef,
    fileContent,
    setFileContent,
    projectstructure,
    setProjectStructure,
    hasLoadedFiles,
    setHasLoadedFiles,
    activeFile,
    setActiveUsers,
    title,
    setTitle,
  });

  if (!hasLoadedFiles) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950 text-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#0a0a0a] text-white overflow-hidden">
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <ProjectSidebar
          structure={projectstructure.children}
          activeFile={activeFile}
          onFileClick={(filePath) =>
            handleFileClick(
              filePath,
              setActiveFile,
              setFileLanguage,
              setOpenTabs,
              getLanguageFromExtension
            )
          }
          onAddNode={(newNode, path) =>
            handleAddNode({
              newNode,
              path,
              projectstructure,
              setProjectStructure,
              setFileContent,
              setFileLanguage,
              setActiveFile,
              setOpenTabs,
              syncToDB,
            })
          }
          onDeleteNode={(pathToDelete) =>
            handleDeleteNode({
              pathToDelete,
              projectStructure: projectstructure,
              fileContent,
              setOpenTabs,
              openTabs,
              setActiveFile,
              activeFile,
              setProjectStructure,
              setFileContent,
              fileLanguage,
              setFileLanguage,
              getLanguageFromExtension,
              syncToDB,
            })
          }
          onRenameNode={(oldPath, newName) =>
            handleRenameNode({
              oldPath,
              newName,
              projectStructure: projectstructure,
              setProjectStructure,
              fileContent,
              setFileContent,
              setActiveFile,
              activeFile,
              setOpenTabs,
              openTabs,
              fileLanguage,
              setFileLanguage,
              getLanguageFromExtension,
              syncToDB,
            })
          }
        />
      </motion.div>

      <div className="flex-grow flex flex-col p-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 mb-4"
        >
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
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 p-2 rounded-lg shadow-sm text-white"
            >
              <FaSave />
            </button>
            <button
              onClick={() =>
                roomId &&
                window.open(`${API_BASE}/api/download/${roomId}`, "_blank")
              }
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg shadow-sm text-white"
            >
              <FaDownload />
            </button>
          </div>
        </motion.div>

        <div className="flex items-center space-x-1 border-b border-gray-800 bg-[#121212] px-2 py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
          {openTabs.map((file) => {
            const isActive = file === activeFile;
            return (
              <motion.div
                key={file}
                layout
                initial={{ opacity: 0.6, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center px-4 py-1 rounded-t-md cursor-pointer transition-colors whitespace-nowrap font-mono text-sm ${
                  isActive
                    ? "bg-gray-700 text-white font-bold"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setActiveFile(file)}
              >
                <span title={file}>{file.split("/").pop()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updatedTabs = openTabs.filter((f) => f !== file);
                    setOpenTabs(updatedTabs);
                    if (isActive) setActiveFile(updatedTabs.at(-1) || null);
                  }}
                  className="ml-2 hover:text-red-500"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="flex-grow bg-[#1a1a1d] rounded-lg overflow-hidden shadow-inner">
          <AnimatePresence mode="wait">
            {activeFile && fileContent[activeFile] !== undefined ? (
              <motion.div
                key={activeFile}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <CodeEditor
                  key={activeFile}
                  code={fileContent[activeFile]}
                  onCodeChange={(newCode) =>
                    setFileContent((prev) => ({
                      ...prev,
                      [activeFile]: newCode,
                    }))
                  }
                  language={getLanguageFromExtension(activeFile) || "plaintext"}
                />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full text-gray-500 italic"
              >
                Select or create a file to start coding
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#121212] mt-4 p-2 rounded shadow text-white flex flex-wrap items-center gap-2 text-sm border border-gray-700"
        >
          👥 Active Users:
          {activeUsers.length ? (
            [...activeUsers]
              .sort((a, b) => a.username.localeCompare(b.username))
              .map((u, i) => {
                const isSelf = u.username === localStorage.getItem("username");
                return (
                  <span
                    key={u.id || i}
                    className={`px-2 py-1 rounded-full font-medium ${
                      isSelf
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {u.username || "Guest"} {isSelf && "(You)"}
                  </span>
                );
              })
          ) : (
            <span className="ml-2 text-gray-400">None</span>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default EditorPage;
