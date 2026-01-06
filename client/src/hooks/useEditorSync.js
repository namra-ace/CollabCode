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
  token, // ✅ Receive Token
}) {
  const lastSavedRef = useRef(Date.now());
  const isInitialMountRef = useRef(true);
  const lastRemoteStructureSenderRef = useRef(null);

  useInitialLoad({
    roomId,
    socketRef,
    hasLoadedFiles,
    setHasLoadedFiles,
    setFileContent,
    setProjectStructure,
    setTitle,
    fileContent,
    projectstructure,
    token, // ✅ Pass Token
  });

  useStructureUpdates({
    socketRef,
    setFileContent,
    setProjectStructure,
    lastRemoteStructureSenderRef,
  });

  useAutoSave({
    roomId,
    fileContent,
    projectstructure,
    title,
    hasLoadedFiles,
    lastSavedRef,
  });

  useBroadcastStructure({
    roomId,
    socketRef,
    projectstructure,
    fileContent,
    hasLoadedFiles,
    isInitialMountRef,
    lastRemoteStructureSenderRef,
  });

  useActiveUsers({
    roomId,
    socketRef,
    setActiveUsers,
  });
}