import toast from "react-hot-toast";

export function handleFileClick(
  filePath,
  setActiveFile,
  setFileLanguage,
  setOpenTabs,
  getLanguageFromExtension
) {
  setActiveFile(filePath);
  setFileLanguage((prev) => ({
    ...prev,
    [filePath]: getLanguageFromExtension(filePath),
  }));

  setOpenTabs((prevTabs) =>
    prevTabs.includes(filePath) ? prevTabs : [...prevTabs, filePath]
  );
}

export function handleDeleteNode({
  pathToDelete,
  projectStructure,
  fileContent,
  setOpenTabs,
  openTabs,
  setActiveFile,
  activeFile,
  setProjectStructure,
  setFileContent,
  syncToDB,
}) {
  const updatedStructure = structuredClone(projectStructure);
  const updatedFileContent = { ...fileContent };

  const deletedTabs = openTabs.filter((tab) => tab.startsWith(pathToDelete));
  const remainingTabs = openTabs.filter((tab) => !deletedTabs.includes(tab));
  setOpenTabs(remainingTabs);

  if (activeFile && deletedTabs.includes(activeFile)) {
    setActiveFile(remainingTabs.at(-1) || null);
  }

  const deleteFromTree = (nodes, pathParts, currentPath = []) =>
    nodes.filter((node) => {
      const full = [...currentPath, node.name].join("/");
      if (node.name === pathParts[0]) {
        if (pathParts.length === 1) {
          if (node.type === "file") {
            delete updatedFileContent[full];
          } else {
            const collect = (children, base) =>
              children.forEach((child) => {
                const childPath = `${base}/${child.name}`;
                if (child.type === "file") {
                  delete updatedFileContent[childPath];
                } else {
                  collect(child.children, childPath);
                }
              });
            collect(node.children, full);
          }
          return false; // remove this node
        }
        if (node.type === "folder") {
          node.children = deleteFromTree(node.children, pathParts.slice(1), [
            ...currentPath,
            node.name,
          ]);
        }
      }
      return true;
    });

  updatedStructure.children = deleteFromTree(
    updatedStructure.children,
    pathToDelete.split("/")
  );

  setProjectStructure(updatedStructure);
  setFileContent(updatedFileContent);
  syncToDB();
}

export function handleRenameNode({
  oldPath,
  newName,
  projectStructure,
  setProjectStructure,
  fileContent,
  setFileContent,
  setActiveFile,
  activeFile,
  setOpenTabs,
  openTabs,
  syncToDB,
  fileLanguage,
  setFileLanguage,
  getLanguageFromExtension,
}) {
  if (!newName.trim()) return toast.error("Name cannot be empty");
  const trimmedName = newName.trim();
  const pathParts = oldPath.split("/");
  const parentPath = pathParts.slice(0, -1);
  const newPath = [...parentPath, trimmedName].join("/");

  // Duplicate name check
  const checkDuplicateInParent = (structure, parentPath, newName) => {
    let nodes = structure.children;
    for (let part of parentPath) {
      const folder = nodes.find((node) => node.name === part && node.type === "folder");
      if (!folder) return false;
      nodes = folder.children;
    }
    return nodes.some((node) => node.name === newName);
  };

  if (checkDuplicateInParent(projectStructure, parentPath, trimmedName)) {
    return toast.error(`Name "${trimmedName}" already exists`);
  }

  const updatedStructure = structuredClone(projectStructure);
  const updatedFileContent = { ...fileContent };
  const updatedFileLanguage = { ...fileLanguage };

  const renameNode = (nodes, pathParts) => {
    for (let node of nodes) {
      if (node.name === pathParts[0]) {
        if (pathParts.length === 1) {
          node.name = trimmedName;
        } else if (node.type === "folder") {
          renameNode(node.children, pathParts.slice(1));
        }
      }
    }
  };

  renameNode(updatedStructure.children, pathParts);

  // Helper to update keys starting with oldPath
  const updateKeyPaths = (obj, transform) => {
    const result = {};
    for (let key in obj) {
      if (key === oldPath) {
        result[newPath] = obj[key];
      } else if (key.startsWith(oldPath + "/")) {
        const newKey = key.replace(oldPath + "/", newPath + "/");
        result[newKey] = obj[key];
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  };

  const updatedTabs = openTabs.map((tab) =>
    tab === oldPath
      ? newPath
      : tab.startsWith(oldPath + "/")
      ? tab.replace(oldPath + "/", newPath + "/")
      : tab
  );

  const updatedActiveFile =
    activeFile === oldPath
      ? newPath
      : activeFile?.startsWith(oldPath + "/")
      ? activeFile.replace(oldPath + "/", newPath + "/")
      : activeFile;

  // Update state
  setProjectStructure(updatedStructure);
  setFileContent(updateKeyPaths(updatedFileContent));
  setFileLanguage(updateKeyPaths(updatedFileLanguage, getLanguageFromExtension));
  setOpenTabs(updatedTabs);
  setActiveFile(updatedActiveFile);
  syncToDB();

  console.log("✅ Renamed:", oldPath, "➡️", newPath);
}
