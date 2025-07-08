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
  const prevFileContentRef = useRef({});
  const emitTimeoutRef = useRef(null);
  const preventEmitRef = useRef(false);
  const API_BASE = import.meta.env.VITE_API_URL;

  // Load from socket or DB
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
    };

    socket.on("load-all-files", handleLoad);
    return () => {
      socket.off("load-all-files", handleLoad);
      clearTimeout(timeout);
    };
  }, [roomId, hasLoadedFiles]);

  // Handle incoming structure update
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStructureUpdate = ({ structure, files }) => {
      preventEmitRef.current = true;
      setFileContent(files || {});
      setProjectStructure(structure || { type: "folder", name: "root", children: [] });
      prevStructureRef.current = structure;
      prevFileContentRef.current = files;
      setTimeout(() => (preventEmitRef.current = false), 50);
    };

    socket.on("structure-update", handleStructureUpdate);
    return () => socket.off("structure-update", handleStructureUpdate);
  }, []);

  // Handle incoming code updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleCodeChange = ({ filePath, code }) => {
      preventEmitRef.current = true;
      setFileContent((prev) => ({ ...prev, [filePath]: code }));
      setTimeout(() => (preventEmitRef.current = false), 50);
    };

    socket.on("code-change", handleCodeChange);
    return () => socket.off("code-change", handleCodeChange);
  }, []);

  // Broadcast file changes
  useEffect(() => {
    if (!activeFile || !hasLoadedFiles) return;
    const socket = socketRef?.current;
    if (!socket || preventEmitRef.current) return;

    const code = fileContent?.[activeFile];
    if (code === undefined) return;

    socket.emit("code-change", { roomId, filePath: activeFile, code });
  }, [fileContent, activeFile, roomId, hasLoadedFiles]);

  // Debounced structure/code sync
  useEffect(() => {
    if (!hasLoadedFiles || preventEmitRef.current) return;

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
        console.log("📤 Structure emitted");
      }
    }, 300); // debounce
  }, [projectstructure, fileContent, hasLoadedFiles]);

  // Periodic DB autosave
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

  // Active user updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    const handleActiveUsersUpdate = (users) => setActiveUsers(users);
    socket.on("active-users-update", handleActiveUsersUpdate);
    return () => socket.off("active-users-update", handleActiveUsersUpdate);
  }, [roomId, setActiveUsers]);
}
