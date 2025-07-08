import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

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
  const preventEmitRef = useRef(false);
  const preventStructureEmitRef = useRef(false);
  const lastSavedRef = useRef(Date.now());
  const isInitialMountRef = useRef(true);
  const lastStructureJSON = useRef("");
  const API_BASE = import.meta.env.VITE_API_URL;

  // Load from socket or fallback DB
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    socket.emit("request-all-files", { roomId });

    const timeout = setTimeout(async () => {
      if (!hasLoadedFiles) {
        try {
          const res = await fetch(`${API_BASE}/api/room/${roomId}`);
          if (res.ok) {
            const data = await res.json();
            setFileContent(data.files || {});
            setProjectStructure(
              data.structure || { type: "folder", name: "root", children: [] }
            );
            setTitle?.(data.title || "");
            lastStructureJSON.current = JSON.stringify(data.structure || {});
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
      setProjectStructure(
        structure || { type: "folder", name: "root", children: [] }
      );
      setTitle?.(title || "");
      lastStructureJSON.current = JSON.stringify(structure || {});
      setHasLoadedFiles(true);
    };

    socket.on("load-all-files", handleLoad);
    return () => {
      socket.off("load-all-files", handleLoad);
      clearTimeout(timeout);
    };
  }, [roomId, hasLoadedFiles]);

  // Incoming structure updates
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleStructureUpdate = ({ structure, files }) => {
      if (preventStructureEmitRef.current) {
        console.log("📥 Ignored own structure update");
        return;
      }

      console.log("📥 Received structure update");
      setFileContent(files || {});
      setProjectStructure(
        structure || { type: "folder", name: "root", children: [] }
      );
      lastStructureJSON.current = JSON.stringify(structure || {});
    };

    socket.on("structure-update", handleStructureUpdate);
    return () => socket.off("structure-update", handleStructureUpdate);
  }, []);

  // Incoming code changes
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

  // Emit code changes
  useEffect(() => {
    if (!activeFile || !hasLoadedFiles) return;
    const socket = socketRef?.current;
    if (!socket || preventEmitRef.current) return;

    const code = fileContent?.[activeFile];
    if (code === undefined) return;

    socket.emit("code-change", {
      roomId,
      filePath: activeFile,
      code,
    });
  }, [activeFile, fileContent, roomId, hasLoadedFiles]);

  // Auto-save to DB every 3s
  useEffect(() => {
    if (!hasLoadedFiles) return;
    const now = Date.now();
    if (now - lastSavedRef.current < 1000) return;

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

      lastSavedRef.current = Date.now();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [fileContent, projectstructure, title, hasLoadedFiles]);

  // Broadcast structure only if it actually changed
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !hasLoadedFiles) return;

    const currentStructureJSON = JSON.stringify(projectstructure);
    if (currentStructureJSON === lastStructureJSON.current) return;

    lastStructureJSON.current = currentStructureJSON;
    preventStructureEmitRef.current = true;

    socket.emit("structure-update", {
      roomId,
      structure: projectstructure,
      files: fileContent,
    });

    console.log("📤 Structure update sent");

    setTimeout(() => {
      preventStructureEmitRef.current = false;
    }, 50);
  }, [projectstructure, fileContent, roomId, hasLoadedFiles]);

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
