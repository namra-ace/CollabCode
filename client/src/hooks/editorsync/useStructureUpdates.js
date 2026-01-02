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
      // Ignore our own structure broadcasts to prevent feedback loops
      if (sender === socket.id) {
        return;
      }

      lastRemoteStructureSenderRef.current = sender;

      setFileContent(files || {});
      setProjectStructure(
        structure || { type: "folder", name: "root", children: [] }
      );
    };

    socket.on("structure-update", handleStructureUpdate);
    return () => socket.off("structure-update", handleStructureUpdate);
  }, []);
}
