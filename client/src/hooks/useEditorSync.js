import { useRef } from "react";

import { useInitialLoad } from "./editorsync/useInitialLoad";
import { useStructureUpdates } from "./editorsync/useStructureUpdates";
import { useAutoSave } from "./editorsync/useAutoSave";
import { useBroadcastStructure } from "./editorsync/useBroadcastStructures";
import { useActiveUsers } from "./editorsync/useActiveUsers";

export default function useEditorSync({
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
}) {
  const lastSavedRef = useRef(Date.now());
  const isInitialMountRef = useRef(true);
  const lastRemoteStructureSenderRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useInitialLoad({
    roomId,
    socketRef,
    hasLoadedFiles,
    setHasLoadedFiles,
    setFileContent,
    setProjectStructure,
    setTitle,
  });


  // ===============================
  // 2. Incoming Structure Updates (File Tree)
  // ===============================

  useStructureUpdates({
    socketRef,
    setFileContent,
    setProjectStructure,
    lastRemoteStructureSenderRef,
  });



  // ===============================
  // 3. Auto-Save to DB (Every 3s)
  // ===============================
  useAutoSave({
    roomId,
    fileContent,
    projectstructure,
    title,
    hasLoadedFiles,
    lastSavedRef,
  });

  // ===============================
  // 4. Broadcast Structure Changes
  // ===============================
  useBroadcastStructure({
    roomId,
    socketRef,
    projectstructure,
    fileContent,
    hasLoadedFiles,
    isInitialMountRef,
    lastRemoteStructureSenderRef,
  });



  // ===============================
  // 5. Active Users Presence
  // ===============================
  useActiveUsers({
    roomId,
    socketRef,
    setActiveUsers,
  });

}