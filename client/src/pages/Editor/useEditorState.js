import { useState } from "react";

export function useEditorState() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [title, setTitle] = useState("");
  const [fileLanguage, setFileLanguage] = useState({});
  const [projectstructure, setProjectStructure] = useState({
    type: "folder",
    name: "root",
    children: [],
  });
  const [fileContent, setFileContent] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const [hasLoadedFiles, setHasLoadedFiles] = useState(false);
  const [openTabs, setOpenTabs] = useState([]);

  return {
    activeUsers,
    setActiveUsers,
    title,
    setTitle,
    fileLanguage,
    setFileLanguage,
    projectstructure,
    setProjectStructure,
    fileContent,
    setFileContent,
    activeFile,
    setActiveFile,
    hasLoadedFiles,
    setHasLoadedFiles,
    openTabs,
    setOpenTabs,
  };
}
