import { useEffect } from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export function useAutoSave({
  roomId,
  fileContent,
  projectstructure,
  title,
  hasLoadedFiles,
  lastSavedRef,
}) {
  useEffect(() => {
    if (!hasLoadedFiles) return;

    const now = Date.now();
    if (now - lastSavedRef.current < 1000) return;

    const timeout = setTimeout(() => {
      fetch(`${BACKEND_URL}/api/save`, {
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
}
