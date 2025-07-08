import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import isEqual from "lodash.isequal";
import cloneDeep from "lodash.clonedeep";

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
  const prevStructureRef = useRef(null);
  const prevFileContentRef = useRef(null);
  const emitTimeoutRef = useRef(null);
  const preventBroadcastRef = useRef(false);
  const API_BASE = import.meta.env.VITE_API_URL;

  // Cleanup function for timeouts
  const cleanupTimeouts = useCallback(() => {
    if (emitTimeoutRef.current) {
      clearTimeout(emitTimeoutRef.current);
      emitTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimeouts();
    };
  }, [cleanupTimeouts]);

  // Memoize handlers to prevent recreation on every render
  const handleLoad = useCallback(({ files, structure, title }) => {
    const safeFiles = files || {};
    const safeStructure = structure || { type: "folder", name: "root", children: [] };
    const safeTitle = title || "";

    setFileContent(safeFiles);
    setProjectStructure(safeStructure);
    setTitle?.(safeTitle);
    setHasLoadedFiles(true);
    
    // Use cloneDeep for safer deep cloning
    prevStructureRef.current = cloneDeep(safeStructure);
    prevFileContentRef.current = cloneDeep(safeFiles);
  }, [setFileContent, setProjectStructure, setTitle, setHasLoadedFiles]);

  const handleStructureUpdate = useCallback(({ structure, files, fromUserId }) => {
    console.log("📥 Received structure update", { 
      fromUserId, 
      hasFiles: !!files, 
      hasStructure: !!structure,
      currentlyPreventing: preventBroadcastRef.current 
    });

    // Check if data actually changed
    if (
      isEqual(structure, prevStructureRef.current) &&
      isEqual(files, prevFileContentRef.current)
    ) {
      console.log("📥 Skipped identical incoming structure");
      return;
    }

    console.log("📥 Applied structure update");
    
    const safeFiles = files || {};
    const safeStructure = structure || { type: "folder", name: "root", children: [] };

    setFileContent(safeFiles);
    setProjectStructure(safeStructure);
    
    // Use cloneDeep for safer deep cloning
    prevStructureRef.current = cloneDeep(safeStructure);
    prevFileContentRef.current = cloneDeep(safeFiles);

    // Only prevent our own broadcasts temporarily to avoid echo
    preventBroadcastRef.current = true;
    setTimeout(() => {
      preventBroadcastRef.current = false;
      console.log("🔓 Broadcast prevention lifted");
    }, 100); // Much shorter timeout, just to prevent immediate echo
  }, [setFileContent, setProjectStructure]);

  const handleCodeChange = useCallback(({ filePath, code }) => {
    if (typeof filePath !== 'string' || code === undefined) {
      console.warn("Invalid code change data:", { filePath, code });
      return;
    }

    setFileContent((prev) => ({ ...prev, [filePath]: code }));
    prevFileContentRef.current = {
      ...prevFileContentRef.current,
      [filePath]: code,
    };
  }, [setFileContent]);

  const handleActiveUsersUpdate = useCallback((users) => {
    if (Array.isArray(users)) {
      setActiveUsers(users);
    }
  }, [setActiveUsers]);

  // Load from socket or fallback to DB
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    socket.emit("request-all-files", { roomId });

    const timeout = setTimeout(async () => {
      if (!hasLoadedFiles) {
        try {
          const res = await fetch(`${API_BASE}/api/room/${roomId}`);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          const data = await res.json();
          const safeFiles = data.files || {};
          const safeStructure = data.structure || { type: "folder", name: "root", children: [] };
          const safeTitle = data.title || "";

          setFileContent(safeFiles);
          setProjectStructure(safeStructure);
          setTitle?.(safeTitle);
          
          prevStructureRef.current = cloneDeep(safeStructure);
          prevFileContentRef.current = cloneDeep(safeFiles);
        } catch (err) {
          console.error("❌ DB fetch error:", err);
          toast.error("Failed to load project from database");
        } finally {
          setHasLoadedFiles(true);
        }
      }
    }, 2000);

    socket.on("load-all-files", handleLoad);
    
    return () => {
      socket.off("load-all-files", handleLoad);
      clearTimeout(timeout);
    };
  }, [roomId, hasLoadedFiles, handleLoad, API_BASE, setFileContent, setProjectStructure, setTitle, setHasLoadedFiles]);

  // Incoming structure update
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    socket.on("structure-update", handleStructureUpdate);
    return () => socket.off("structure-update", handleStructureUpdate);
  }, [handleStructureUpdate]);

  // Incoming code changes
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    socket.on("code-change", handleCodeChange);
    return () => socket.off("code-change", handleCodeChange);
  }, [handleCodeChange]);

  // Outgoing code change
  useEffect(() => {
    if (!activeFile || !hasLoadedFiles) return;
    const socket = socketRef?.current;
    if (!socket) return;

    const code = fileContent?.[activeFile];
    const prevCode = prevFileContentRef.current?.[activeFile];
    
    // Only emit if code actually changed and is valid
    if (code !== prevCode && code !== undefined && typeof code === 'string') {
      socket.emit("code-change", { roomId, filePath: activeFile, code });
      
      // Update ref safely
      if (prevFileContentRef.current) {
        prevFileContentRef.current[activeFile] = code;
      }
    }
  }, [fileContent, activeFile, roomId, hasLoadedFiles, socketRef]);

  // Outgoing structure update with improved stability
  useEffect(() => {
    if (!hasLoadedFiles) {
      console.log("🚫 Skipping outgoing structure update - files not loaded");
      return;
    }

    const changedStructure = !isEqual(projectstructure, prevStructureRef.current);
    const changedFiles = !isEqual(fileContent, prevFileContentRef.current);

    if (!changedStructure && !changedFiles) {
      console.log("📊 No changes detected in structure or files");
      return;
    }

    console.log("📊 Changes detected", { changedStructure, changedFiles });

    // Clear existing timeout
    cleanupTimeouts();
    
    emitTimeoutRef.current = setTimeout(() => {
      const socket = socketRef?.current;
      if (socket) {
        // Only skip if we're in the brief prevention period after receiving an update
        if (preventBroadcastRef.current) {
          console.log("🚫 Skipped emit - preventing echo");
          return;
        }

        console.log("📤 Emitting structure update");
        
        socket.emit("structure-update", {
          roomId,
          structure: projectstructure,
          files: fileContent,
          fromUserId: socket.id,
        });
        
        // Update refs safely with cloneDeep
        prevStructureRef.current = cloneDeep(projectstructure);
        prevFileContentRef.current = cloneDeep(fileContent);
        
        console.log("📤 Structure broadcasted");
      } else {
        console.log("🚫 Skipped emit - no socket");
      }
    }, 300);
  }, [projectstructure, fileContent, hasLoadedFiles, roomId, socketRef, cleanupTimeouts]);

  // Periodic autosave to DB
  useEffect(() => {
    if (!hasLoadedFiles || !roomId) return;
    
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            files: fileContent,
            structure: projectstructure,
            title,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Auto-save failed: ${response.statusText}`);
        }
      } catch (err) {
        console.error("🧨 Auto-save failed:", err);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [fileContent, projectstructure, title, hasLoadedFiles, roomId, API_BASE]);

  // Active users update
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    socket.on("active-users-update", handleActiveUsersUpdate);
    return () => socket.off("active-users-update", handleActiveUsersUpdate);
  }, [roomId, handleActiveUsersUpdate]);
}