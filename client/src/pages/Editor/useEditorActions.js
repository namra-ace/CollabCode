import toast from "react-hot-toast";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export function useEditorActions({
  roomId,
  token,
  fileContent,
  projectstructure,
  title,
  hasLoadedFiles,
}) {
  const handleSave = async () => {
    if (!roomId) return toast.error("No room ID");
    try {
      const res = await fetch(`${BACKEND_URL}/api/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          roomId,
          files: fileContent,
          structure: projectstructure,
          title,
        }),
      });

      res.ok
        ? toast.success("✅ Project saved")
        : toast.error(`❌ ${await res.text()}`);
    } catch (err) {
      toast.error(`⚠️ Save error: ${err.message}`);
    }
  };

  const syncToDB = () => {
    if (!roomId || !hasLoadedFiles) return;
    fetch(`${BACKEND_URL}/api/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        roomId,
        files: fileContent,
        structure: projectstructure,
        title,
      }),
    }).catch((err) => console.error("DB Sync Failed", err));
  };

  return { handleSave, syncToDB };
}
