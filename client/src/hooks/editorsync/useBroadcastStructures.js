import { useEffect } from "react";

export function useBroadcastStructure({
  roomId,
  socketRef,
  projectstructure,
  fileContent,
  hasLoadedFiles,
  isInitialMountRef,
  lastRemoteStructureSenderRef,
}) {
  useEffect(() => {
    const socket = socketRef?.current;
    
    // 1. Safety Checks
    if (!socket) return;
    if (!hasLoadedFiles) return;

    // 2. Skip Initial Mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // 3. Block Echo (If this update came from the server, don't send it back)
    if (lastRemoteStructureSenderRef.current) {
      lastRemoteStructureSenderRef.current = null;
      return;
    }

    // 4. EMIT UPDATE
    socket.emit("structure-update", {
      roomId,
      structure: projectstructure,
      files: fileContent,
      sender: socket.id,
    });
    
  }, [projectstructure, fileContent, hasLoadedFiles, roomId]);
}