import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast"; // ✅ Import toast hook only

import Spinner from "../components/common/Spinner";
import ProjectSidebar from "../components/sidebar/ProjectSidebar";
import { useAuth } from "../context/AuthContext";

import { useEditorState } from "./Editor/useEditorState";
import { useEditorActions } from "./Editor/useEditorActions";
import { useEditorRealtime } from "./Editor/useEditorRealtime";

import EditorHeader from "./Editor/EditorHeader";
import EditorTabs from "./Editor/EditorTabs";
import EditorWorkspace from "./Editor/EditorWorkSpace";
import EditorFooter from "./Editor/EditorFooter";

import {
  handleFileClick,
  handleDeleteNode,
  handleRenameNode,
} from "../utils/fileTree/FileOperations";

import {
  getLanguageFromExtension,
  handleAddNode,
} from "../utils/fileTree/structureOperations";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function EditorPage() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [canConnect, setCanConnect] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const verifyAccess = async () => {
      const passcode = location.state?.passcode;

      if (!passcode) {
        if (isAuthenticated && !token) return;
        setCanConnect(true);
        return;
      }

      setIsVerifying(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/verify-passcode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ roomId, passcode }),
        });

        const data = await res.json();
        
        if (res.ok) {
          toast.success("Access Granted");
        } else {
          toast.error(data.error || "Access Denied");
          // Slight delay before kicking them out so they can read the toast
          setTimeout(() => navigate("/"), 2000);
        }
      } catch (err) {
        console.error("Verification error:", err);
        toast.error("Network Error: Could not verify access");
      } finally {
        setIsVerifying(false);
        setCanConnect(true);
      }
    };

    verifyAccess();
  }, [roomId, token, location.state, authLoading, isAuthenticated, navigate]);

  const {
    activeUsers,
    setActiveUsers,
    title,
    setTitle,
    fileLanguage,
    setFileLanguage,
    projectstructure,
    setProjectStructure,
    fileContent,
    setFileContent,
    activeFile,
    setActiveFile,
    hasLoadedFiles,
    setHasLoadedFiles,
    openTabs,
    setOpenTabs,
  } = useEditorState();

  const { handleSave, syncToDB } = useEditorActions({
    roomId,
    token,
    fileContent,
    projectstructure,
    title,
    hasLoadedFiles,
  });

  const effectiveRoomId = canConnect ? roomId : null;

  const { provider, yDoc } = useEditorRealtime({
    roomId: effectiveRoomId,
    activeFile,
    fileContent,
    setFileContent,
    projectstructure,
    setProjectStructure,
    hasLoadedFiles,
    setHasLoadedFiles,
    setActiveUsers,
    title,
    setTitle,
    token,
  });

  if (authLoading || isVerifying || !hasLoadedFiles) {
    return (
      <div className="h-screen w-screen flex flex-col gap-4 items-center justify-center bg-gray-950 text-white">
        <Spinner />
        {isVerifying && <p className="text-cyan-400 animate-pulse">Verifying Access...</p>}
        {authLoading && <p className="text-gray-500">Authenticating...</p>}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#0a0a0a] text-white overflow-hidden">
      {/* ❌ No <Toaster /> here, it is in main.jsx */}

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
        <EditorHeader
          title={title}
          setTitle={setTitle}
          onSave={handleSave}
          roomId={roomId}
          navigate={navigate}
          backendUrl={BACKEND_URL}
        />

        <EditorTabs
          openTabs={openTabs}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          setOpenTabs={setOpenTabs}
        />

        {provider && (
          <EditorWorkspace
            activeFile={activeFile}
            fileContent={fileContent}
            fileLanguage={fileLanguage}
            provider={provider}
            yDoc={yDoc}
            setFileContent={setFileContent}
          />
        )}

        <EditorFooter activeUsers={activeUsers} />
      </div>
    </div>
  );
}

export default EditorPage;