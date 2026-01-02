import { useEffect } from "react";
import toast from "react-hot-toast";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export function useInitialLoad({
  roomId,
  socketRef,
  hasLoadedFiles,
  setHasLoadedFiles,
  setFileContent,
  setProjectStructure,
  setTitle,
}) {
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !roomId) return;

    socket.emit("request-all-files", { roomId });

    const timeout = setTimeout(async () => {
      if (!hasLoadedFiles) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/room/${roomId}`);
          if (res.ok) {
            const data = await res.json();
            setFileContent(data.files || {});
            setProjectStructure(
              data.structure || { type: "folder", name: "root", children: [] }
            );
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
      setProjectStructure(
        structure || { type: "folder", name: "root", children: [] }
      );
      setTitle?.(title || "");
      setHasLoadedFiles(true);
    };

    socket.on("load-all-files", handleLoad);
    return () => {
      socket.off("load-all-files", handleLoad);
      clearTimeout(timeout);
    };
  }, [roomId, hasLoadedFiles]);
}
