import useSocket from "../../hooks/useSocket";
import useEditorSync from "../../hooks/useEditorSync"; // Make sure path is correct
import { useYjs } from "../../hooks/useYjs";

export function useEditorRealtime({
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
  token, 
}) {
  const socketRef = useSocket(roomId, { token });

  const { provider, yDoc } = useYjs(roomId, activeFile, { token });

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
    token, // ✅ Pass Token here
  });

  return { socketRef, provider, yDoc };
}