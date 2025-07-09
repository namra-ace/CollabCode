// src/pages/EditorPageParts/structureOperations.js
import toast from "react-hot-toast";

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
  return map[ext] || "javascript"; // fallback
}

export function handleAddNode({
  newNode,
  path,
  projectstructure,
  setProjectStructure,
  setFileContent,
  setFileLanguage,
  setActiveFile,
  setOpenTabs,
  syncToDB
}) {
  const checkDuplicate = (nodes, name) => nodes.some((node) => node.name === name);

  const updatedStructure = structuredClone(projectstructure);
  const insert = (nodes, currentPath) => {
    for (let node of nodes) {
      if (node.type === "folder" && node.name === currentPath[0]) {
        if (currentPath.length === 1) {
          if (checkDuplicate(node.children, newNode.name)) {
            toast.error(`Name "${newNode.name}" already exists`);
            return false;
          }
          node.children.push(newNode);
        } else {
          return insert(node.children, currentPath.slice(1));
        }
        return true;
      }
    }
    return false;
  };

  let success = true;
  if (path.length === 0) {
    if (checkDuplicate(updatedStructure.children, newNode.name)) {
      toast.error(`Name "${newNode.name}" already exists`);
      return;
    }
    updatedStructure.children.push(newNode);
  } else {
    success = insert(updatedStructure.children, path);
    if (!success) {
      toast.error("Failed to add node - path not found");
      return;
    }
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
    setOpenTabs((prev) => [...prev, fullPath]);
  }

  syncToDB();
}

export function broadcastStructure({
  socket,
  hasLoadedFiles,
  preventStructureEmitRef,
  projectstructure,
  fileContent,
  roomId,
}) {
  if (socket && hasLoadedFiles && !preventStructureEmitRef.current) {
    preventStructureEmitRef.current = true;
    socket.emit("structure-update", {
      roomId,
      structure: projectstructure,
      files: fileContent,
    });
    console.log("📤 Structure broadcasted:", projectstructure);
    setTimeout(() => {
      preventStructureEmitRef.current = false;
    }, 100);
  }
}