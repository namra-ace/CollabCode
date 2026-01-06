import { useEffect } from "react";

export function useStructureUpdates({
  socketRef,
  setFileContent,
  setProjectStructure,
  lastRemoteStructureSenderRef,
}) {
  useEffect(() => {
    const socket = socketRef?.current;
    
    if (!socket) return;

    const handleStructureUpdate = ({ structure, files, sender }) => {
      // Ignore our own structure broadcasts
      if (sender === socket.id) return;

      // Mark this update as "remote" so useBroadcastStructure doesn't echo it back
      lastRemoteStructureSenderRef.current = sender;

      if (files) setFileContent(files);
      if (structure) setProjectStructure(structure);
    };

    socket.on("structure-update", handleStructureUpdate);
    
    return () => {
      socket.off("structure-update", handleStructureUpdate);
    };
  }, [socketRef.current]); 
}