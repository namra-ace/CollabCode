import useSocket from "../../hooks/useSocket";
import useEditorSync from "../../hooks/useEditorSync";
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
}) {
  const socketRef = useSocket(roomId);

  const { provider, yDoc } = useYjs(roomId, activeFile);

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

  return { socketRef, provider, yDoc };
}
