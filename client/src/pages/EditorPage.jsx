import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  const { token } = useAuth();
  const { roomId } = useParams();
  const navigate = useNavigate();

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

  const { provider, yDoc } = useEditorRealtime({
    roomId,
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

        <EditorWorkspace
          activeFile={activeFile}
          fileContent={fileContent}
          fileLanguage={fileLanguage}
          provider={provider}
          yDoc={yDoc}
          setFileContent={setFileContent}
        />


        <EditorFooter activeUsers={activeUsers} />

      </div>
    </div>
  );
}

export default EditorPage;