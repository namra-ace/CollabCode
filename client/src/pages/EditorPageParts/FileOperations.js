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

  setOpenTabs((prevTabs) => {
    if (!prevTabs.includes(filePath)) {
      return [...prevTabs, filePath];
    }
    return prevTabs;
  });
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
  setOpenTabs((prevTabs) =>
    prevTabs.filter((tab) => !tab.startsWith(pathToDelete))
  );

  if (activeFile && deletedTabs.includes(activeFile)) {
    const remainingTabs = openTabs.filter((tab) => !deletedTabs.includes(tab));
    setActiveFile(remainingTabs[remainingTabs.length - 1] || null);
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
    getLanguageFromExtension, // <- Pass this from EditorPage
  }) {
    if (!newName || newName.trim() === "") {
      toast.error("Name cannot be empty");
      return;
    }
  
    const trimmedName = newName.trim();
    const pathParts = oldPath.split("/");
    const parentPath = pathParts.slice(0, -1);
    const newPath = [...parentPath, trimmedName].join("/");
  
    // Check for duplicates in the same folder
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
      toast.error(`Name "${trimmedName}" already exists`);
      return;
    }
  
    const updatedStructure = structuredClone(projectStructure);
    const updatedFileContent = { ...fileContent };
  
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
  
    // Rename file contents
    const updatedKeys = {};
    Object.keys(updatedFileContent).forEach((key) => {
      if (key === oldPath) {
        updatedKeys[newPath] = updatedFileContent[key];
        delete updatedFileContent[key];
      } else if (key.startsWith(oldPath + "/")) {
        const newKey = key.replace(oldPath + "/", newPath + "/");
        updatedKeys[newKey] = updatedFileContent[key];
        delete updatedFileContent[key];
      }
    });
    Object.assign(updatedFileContent, updatedKeys);
  
    // Update fileLanguage (💡 detect language again)
    const updatedFileLanguage = { ...fileLanguage };
    Object.keys(fileLanguage).forEach((key) => {
      if (key === oldPath) {
        updatedFileLanguage[newPath] = getLanguageFromExtension(newPath);
        delete updatedFileLanguage[key];
      } else if (key.startsWith(oldPath + "/")) {
        const newKey = key.replace(oldPath + "/", newPath + "/");
        updatedFileLanguage[newKey] = getLanguageFromExtension(newKey);
        delete updatedFileLanguage[key];
      }
    });
  
    // Update open tabs
    const updatedTabs = openTabs.map((tab) =>
      tab === oldPath
        ? newPath
        : tab.startsWith(oldPath + "/")
        ? tab.replace(oldPath + "/", newPath + "/")
        : tab
    );
  
    // Update active file
    let updatedActiveFile = activeFile;
    if (activeFile === oldPath) {
      updatedActiveFile = newPath;
    } else if (activeFile?.startsWith(oldPath + "/")) {
      updatedActiveFile = activeFile.replace(oldPath + "/", newPath + "/");
    }
  
    // Apply all state updates
    setProjectStructure(updatedStructure);
    setFileContent(updatedFileContent);
    setFileLanguage(updatedFileLanguage);
    setOpenTabs(updatedTabs);
    setActiveFile(updatedActiveFile);
    syncToDB();
  
    console.log("✅ Renamed with language detection:", oldPath, "➡️", newPath);
  }
  
