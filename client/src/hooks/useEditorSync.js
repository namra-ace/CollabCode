import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import isEqual from "lodash.isequal";

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
  const API_BASE = import.meta.env.VITE_API_URL;

  const preventBroadcastRef = useRef(false); // 🔒 block self-trigger

  // Load from socket or fallback to DB
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    socket.emit("request-all-files", { roomId });

    const timeout = setTimeout(async () => {
      if (!hasLoadedFiles) {
        try {
          const res = await fetch(`${API_BASE}/api/room/${roomId}`);
          const data = await res.json();
          if (res.ok) {
            setFileContent(data.files || {});
            setProjectStructure(data.structure || { type: "folder", name: "root", children: [] });
            setTitle?.(data.title || "");
            prevStructureRef.current = data.structure || {};
            prevFileContentRef.current = data.files || {};
          } else {
            console.error("❌ DB fetch error:", res.status);
          }
        } catch (err) {
          toast.error("❌ Failed to load project from DB");
        } finally {
          setHasLoadedFiles(true);
        }
      }
    }, 2000);

    const handleLoad = ({ files, structure, title }) => {
      clearTimeout(timeout);
      setFileContent(files || {});
      setProjectStructure(structure || { type: "folder", name: "root", children: [] });
      setTitle?.(title || "");
      setHasLoadedFiles(true);
      prevStructureRef.current = structure || {};
      prevFileContentRef.current = files || {};
    };

    socket.on("load-all-files", handleLoad);
    return () => {
      socket.off("load-all-files", handleLoad);
      clearTimeout(timeout);
    };
  }, [roomId, hasLoadedFiles]);

  // Incoming structure update
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStructureUpdate = ({ structure, files }) => {
      if (
        isEqual(structure, prevStructureRef.current) &&
        isEqual(files, prevFileContentRef.current)
      ) {
        console.log("📥 Skipped identical incoming structure");
        return;
      }

      console.log("📥 Applied structure update");
      preventBroadcastRef.current = true;
      setFileContent(files || {});
      setProjectStructure(structure || { type: "folder", name: "root", children: [] });
      prevStructureRef.current = structure;
      prevFileContentRef.current = files;

      // Reset after short delay
      setTimeout(() => {
        preventBroadcastRef.current = false;
      }, 100);
    };

    socket.on("structure-update", handleStructureUpdate);
    return () => socket.off("structure-update", handleStructureUpdate);
  }, []);

  // Incoming code changes
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleCodeChange = ({ filePath, code }) => {
      setFileContent((prev) => ({ ...prev, [filePath]: code }));
      prevFileContentRef.current = {
        ...prevFileContentRef.current,
        [filePath]: code,
      };
    };

    socket.on("code-change", handleCodeChange);
    return () => socket.off("code-change", handleCodeChange);
  }, []);

  // Outgoing code change
  useEffect(() => {
    if (!activeFile || !hasLoadedFiles) return;
    const socket = socketRef?.current;
    if (!socket) return;

    const code = fileContent?.[activeFile];
    const prevCode = prevFileContentRef.current?.[activeFile];
    if (code !== prevCode) {
      socket.emit("code-change", { roomId, filePath: activeFile, code });
      prevFileContentRef.current = {
        ...prevFileContentRef.current,
        [activeFile]: code,
      };
    }
  }, [fileContent, activeFile, roomId, hasLoadedFiles]);

  // Outgoing structure update
  useEffect(() => {
    if (!hasLoadedFiles || preventBroadcastRef.current) return;

    const changedStructure = !isEqual(projectstructure, prevStructureRef.current);
    const changedFiles = !isEqual(fileContent, prevFileContentRef.current);

    if (!changedStructure && !changedFiles) return;

    if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
    emitTimeoutRef.current = setTimeout(() => {
      const socket = socketRef?.current;
      if (socket) {
        socket.emit("structure-update", {
          roomId,
          structure: projectstructure,
          files: fileContent,
        });
        prevStructureRef.current = projectstructure;
        prevFileContentRef.current = fileContent;
        console.log("📤 Structure broadcasted");
      }
    }, 300);
  }, [projectstructure, fileContent, hasLoadedFiles, roomId]);

  // Periodic autosave to DB
  useEffect(() => {
    if (!hasLoadedFiles) return;
    const timeout = setTimeout(() => {
      fetch(`${API_BASE}/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          files: fileContent,
          structure: projectstructure,
          title,
        }),
      }).catch((err) => console.error("🧨 Auto-save failed:", err));
    }, 3000);

    return () => clearTimeout(timeout);
  }, [fileContent, projectstructure, title, hasLoadedFiles]);

  // Active users update
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    const handleActiveUsersUpdate = (users) => {
      setActiveUsers(users);
    };

    socket.on("active-users-update", handleActiveUsersUpdate);
    return () => socket.off("active-users-update", handleActiveUsersUpdate);
  }, [roomId, setActiveUsers]);
}
