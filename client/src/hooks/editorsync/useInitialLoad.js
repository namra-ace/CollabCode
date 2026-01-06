import { useEffect, useRef } from "react";

export function useInitialLoad({
  roomId,
  socketRef,
  hasLoadedFiles,
  setHasLoadedFiles,
  setFileContent,
  setProjectStructure,
  setTitle,
  fileContent,
  projectstructure,
  token,
}) {
  const fileContentRef = useRef(fileContent);
  const structureRef = useRef(projectstructure);
  const hasLoadedRef = useRef(hasLoadedFiles);

  // Keep refs synced with props
  useEffect(() => {
    fileContentRef.current = fileContent;
    structureRef.current = projectstructure;
    hasLoadedRef.current = hasLoadedFiles;
  }, [fileContent, projectstructure, hasLoadedFiles]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    let fallbackTimer = null;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // 1. Success Handler (Receive Data)
    const handleLoadAllFiles = ({ files, structure }) => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      
      if (files) setFileContent(files);
      if (structure) setProjectStructure(structure);
      setHasLoadedFiles(true);
    };

    // 2. Responder (Send Data)
    const handleRequestAllFiles = ({ requesterId }) => {
      if (!hasLoadedRef.current) return;
      
      socket.emit("send-all-files", {
        roomId,
        files: fileContentRef.current,
        structure: structureRef.current,
        to: requesterId,
      });
    };

    // 3. Fallback (Fetch DB)
    const fetchFromDB = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/room/${roomId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          if (data.files) setFileContent(data.files);
          if (data.structure) setProjectStructure(data.structure);
          if (data.title) setTitle(data.title);
          setHasLoadedFiles(true);
        }
      } catch (err) {
        console.error("[InitialLoad] DB Fetch Error:", err);
      }
    };

    // 4. Trigger Logic
    const initiateSync = () => {
        if (hasLoadedRef.current) return; 

        socket.emit("request-all-files", { roomId });
        
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(fetchFromDB, 3000);
    };

    // Attach Listeners
    socket.on("load-all-files", handleLoadAllFiles);
    socket.on("request-all-files", handleRequestAllFiles);

    if (socket.connected) {
        initiateSync();
    } else {
        socket.on("connect", initiateSync);
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      socket.off("load-all-files", handleLoadAllFiles);
      socket.off("request-all-files", handleRequestAllFiles);
      socket.off("connect", initiateSync);
    };
  }, [roomId, socketRef, token]); 
}