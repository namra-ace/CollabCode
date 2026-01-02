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
    if (!socket || !hasLoadedFiles) return;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (lastRemoteStructureSenderRef.current) {
      lastRemoteStructureSenderRef.current = null;
      return;
    }

    socket.emit("structure-update", {
      roomId,
      structure: projectstructure,
      files: fileContent,
      sender: socket.id,
    });
  }, [projectstructure, hasLoadedFiles]);
}
