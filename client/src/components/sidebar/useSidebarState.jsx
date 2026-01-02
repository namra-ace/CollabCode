import { useState, useEffect } from "react";

export function useSidebarState({
  structure,
  onAddNode,
  onRenameNode,
}) {
  // ===============================
  // State (UI-only sidebar state)
  // ===============================
  const [pendingAdd, setPendingAdd] = useState(null);
  const [renamingPath, setRenamingPath] = useState(null);
  const [inputName, setInputName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // ===============================
  // Folder Expand / Collapse Logic
  // ===============================
  const toggleFolder = (path) => {
    setExpandedFolders((prev) => {
      const copy = new Set(prev);
      copy.has(path) ? copy.delete(path) : copy.add(path);
      return copy;
    });
  };

  // ===============================
  // Add / Rename Handlers
  // ===============================
  const handleAddClick = (type, path) => {
    const fullPath = path.join("/");
    setExpandedFolders((prev) => new Set(prev).add(fullPath));
    setPendingAdd({ type, path });
  };

  const confirmAdd = () => {
    if (!inputName.trim() || !pendingAdd) return;

    const newNode =
      pendingAdd.type === "file"
        ? { type: "file", name: inputName }
        : { type: "folder", name: inputName, children: [] };

    onAddNode(newNode, pendingAdd.path);
    setPendingAdd(null);
    setInputName("");
  };

  const confirmRename = () => {
    if (!inputName.trim() || !renamingPath) return;
    onRenameNode(renamingPath, inputName);
    setRenamingPath(null);
    setInputName("");
  };

  // ===============================
  // Reset transient UI state on structure change
  // ===============================
  useEffect(() => {
    setPendingAdd(null);
    setRenamingPath(null);
    setInputName("");
  }, [structure]);

  return {
    pendingAdd,
    setPendingAdd,
    renamingPath,
    setRenamingPath,
    inputName,
    setInputName,
    expandedFolders,
    toggleFolder,
    handleAddClick,
    confirmAdd,
    confirmRename,
  };
}
