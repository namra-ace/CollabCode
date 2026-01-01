import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";

function ProjectSidebar({
  structure,
  activeFile,
  onFileClick,
  onAddNode,
  onRenameNode,
  onDeleteNode,
}) {
  const [addingItem, setAddingItem] = useState(null);
  const [renamingPath, setRenamingPath] = useState(null);
  const [inputName, setInputName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => {
      const copy = new Set(prev);
      copy.has(path) ? copy.delete(path) : copy.add(path);
      return copy;
    });
  };

  const handleAddClick = (type, path) => {
    const fullPath = path.join("/");
    setExpandedFolders((prev) => new Set(prev).add(fullPath));
    setAddingItem({ type, path });
  };

  const confirmAdd = () => {
    if (!inputName.trim() || !addingItem) return;
    const newNode =
      addingItem.type === "file"
        ? { type: "file", name: inputName }
        : { type: "folder", name: inputName, children: [] };
    onAddNode(newNode, addingItem.path);
    setAddingItem(null);
    setInputName("");
  };

  const confirmRename = () => {
    if (!inputName.trim() || !renamingPath) return;
    onRenameNode(renamingPath, inputName);
    setRenamingPath(null);
    setInputName("");
  };

  const renderTree = (nodes, path = []) =>
    nodes.map((node) => {
      const fullPath = [...path, node.name].join("/");
      const isRenaming = renamingPath === fullPath;
      const isExpanded = expandedFolders.has(fullPath);

      const baseClasses = `transition-all duration-200 ease-in-out hover:scale-[1.01] px-2 py-1 rounded flex justify-between items-center text-sm ${
        fullPath === activeFile
          ? "bg-blue-600 text-white shadow-md"
          : "hover:bg-gray-700 text-gray-300"
      }`;

      if (node.type === "file") {
        return (
          <div key={fullPath} className={`pl-6 ${baseClasses}`}>
            {isRenaming ? (
              <>
                <input
                  autoFocus
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmRename();
                    if (e.key === "Escape") setRenamingPath(null);
                  }}
                  className="bg-gray-800 text-white px-2 py-1 rounded w-full outline-none"
                />
                <div className="ml-1 flex gap-1">
                  <FaSave className="text-green-400 cursor-pointer" onClick={confirmRename} />
                  <FaTimes className="text-red-400 cursor-pointer" onClick={() => setRenamingPath(null)} />
                </div>
              </>
            ) : (
              <>
                <div onClick={() => onFileClick(fullPath)} className="flex items-center gap-2 w-full">
                  <FaFile className="text-gray-400" />
                  <span className="truncate">{node.name}</span>
                </div>
                <div className="flex gap-1 ml-1">
                  <FaEdit
                    title="Rename"
                    onClick={() => {
                      setRenamingPath(fullPath);
                      setInputName(node.name);
                    }}
                    className="text-yellow-400 cursor-pointer"
                  />
                  <FaTrash
                    title="Delete"
                    onClick={() => onDeleteNode(fullPath)}
                    className="text-red-400 cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>
        );
      }

      if (node.type === "folder") {
        return (
          <div key={fullPath} className="pl-2 text-sm">
            <div className="flex justify-between items-center cursor-pointer hover:bg-gray-700 rounded py-1 px-1 transition-all">
              {isRenaming ? (
                <>
                  <input
                    autoFocus
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename();
                      if (e.key === "Escape") setRenamingPath(null);
                    }}
                    className="bg-gray-800 text-white px-2 py-1 rounded w-full outline-none"
                  />
                  <div className="ml-1 flex gap-1">
                    <FaSave className="text-green-400 cursor-pointer" onClick={confirmRename} />
                    <FaTimes className="text-red-400 cursor-pointer" onClick={() => setRenamingPath(null)} />
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="flex items-center gap-2 w-full"
                    onClick={() => toggleFolder(fullPath)}
                  >
                    {isExpanded ? <FaFolderOpen /> : <FaFolder />}
                    <span className="font-medium text-gray-200">{node.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <FaPlus
                      title="Add File"
                      className="text-green-400 cursor-pointer"
                      onClick={() => handleAddClick("file", [...path, node.name])}
                    />
                    <FaPlus
                      title="Add Folder"
                      className="text-blue-400 cursor-pointer"
                      onClick={() => handleAddClick("folder", [...path, node.name])}
                    />
                    <FaEdit
                      title="Rename"
                      className="text-yellow-400 cursor-pointer"
                      onClick={() => {
                        setRenamingPath(fullPath);
                        setInputName(node.name);
                      }}
                    />
                    <FaTrash
                      title="Delete"
                      className="text-red-400 cursor-pointer"
                      onClick={() => onDeleteNode(fullPath)}
                    />
                  </div>
                </>
              )}
            </div>

            {isExpanded && (
              <div className="ml-4 transition-all duration-200">
                {renderTree(node.children || [], [...path, node.name])}
                {addingItem && addingItem.path.join("/") === fullPath && (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      autoFocus
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmAdd();
                        if (e.key === "Escape") setAddingItem(null);
                      }}
                      className="bg-gray-800 text-white px-2 py-1 rounded w-full outline-none"
                      placeholder={`New ${addingItem.type}`}
                    />
                    <FaSave className="text-green-400 cursor-pointer" onClick={confirmAdd} />
                    <FaTimes className="text-red-400 cursor-pointer" onClick={() => setAddingItem(null)} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      return null;
    });

  useEffect(() => {
    setAddingItem(null);
    setRenamingPath(null);
    setInputName("");
  }, [structure]);

  return (
    <div className="w-64 h-full overflow-y-auto border-r border-gray-700 p-4 bg-black/40 backdrop-blur-md shadow-lg rounded-r-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-300 font-bold text-sm uppercase tracking-wide">Project</span>
        <div className="flex gap-1">
          <button
            onClick={() => handleAddClick("file", [])}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white text-xs shadow"
          >
            + File
          </button>
          <button
            onClick={() => handleAddClick("folder", [])}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white text-xs shadow"
          >
            + Folder
          </button>
        </div>
      </div>

      {renderTree(structure)}

      {addingItem && addingItem.path.length === 0 && (
        <div className="flex items-center gap-1 mt-2">
          <input
            autoFocus
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmAdd();
              if (e.key === "Escape") setAddingItem(null);
            }}
            className="bg-gray-800 text-white px-2 py-1 rounded w-full outline-none"
            placeholder={`New ${addingItem.type}`}
          />
          <FaSave className="text-green-400 cursor-pointer" onClick={confirmAdd} />
          <FaTimes className="text-red-400 cursor-pointer" onClick={() => setAddingItem(null)} />
        </div>
      )}
    </div>
  );
}

export default ProjectSidebar;