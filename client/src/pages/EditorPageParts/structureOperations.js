import toast from "react-hot-toast";

// Language mapping utility
export function getLanguageFromExtension(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const map = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    cpp: "cpp",
    c: "cpp",
    java: "java",
  };
  return map[ext] || "javascript"; // Fallback
}

// Add new file/folder into structure
export function handleAddNode({
  newNode,
  path,
  projectstructure,
  setProjectStructure,
  setFileContent,
  setFileLanguage,
  setActiveFile,
  setOpenTabs,
  syncToDB,
}) {
  const updatedStructure = structuredClone(projectstructure);
  const checkDuplicate = (nodes, name) => nodes.some((node) => node.name === name);

  const insertNode = (nodes, currentPath) => {
    if (currentPath.length === 0) {
      if (checkDuplicate(nodes, newNode.name)) return "duplicate";
      nodes.push(newNode);
      return "success";
    }

    const folder = nodes.find(
      (node) => node.type === "folder" && node.name === currentPath[0]
    );

    if (!folder) return "not_found";

    return insertNode(folder.children, currentPath.slice(1));
  };

  const result = insertNode(
    updatedStructure.children,
    [...path] // Clone path to avoid mutation
  );

  if (result === "duplicate") {
    toast.error(`Name "${newNode.name}" already exists`);
    return false;
  }

  if (result === "not_found") {
    toast.error("❌ Invalid path — folder not found");
    return false;
  }

  setProjectStructure(updatedStructure);

  if (newNode.type === "file") {
    const fullPath = path.length ? `${path.join("/")}/${newNode.name}` : newNode.name;

    setFileContent((prev) => ({
      ...prev,
      [fullPath]: `// ${newNode.name} content`,
    }));

    setFileLanguage((prev) => ({
      ...prev,
      [fullPath]: getLanguageFromExtension(newNode.name),
    }));

    setActiveFile(fullPath);
    setOpenTabs((prev) => (prev.includes(fullPath) ? prev : [...prev, fullPath]));
  }

  syncToDB();
  return true;
}

// Broadcast structure to all peers
export function broadcastStructure({
  socket,
  hasLoadedFiles,
  preventStructureEmitRef,
  projectstructure,
  fileContent,
  roomId,
}) {
  if (!socket || !hasLoadedFiles || preventStructureEmitRef.current) return;

  preventStructureEmitRef.current = true;

  socket.emit("structure-update", {
    roomId,
    structure: projectstructure,
    files: fileContent,
  });

  console.log("📤 Structure broadcasted to room:", roomId);

  setTimeout(() => {
    preventStructureEmitRef.current = false;
  }, 100); // Prevent flood
}
