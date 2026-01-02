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

function TreeNode({
  node,
  path,
  activeFile,
  expandedFolders,
  toggleFolder,
  onFileClick,
  onDeleteNode,
  onRenameNode,
  handleAddClick,
  pendingAdd,
  setPendingAdd,
  renamingPath,
  setRenamingPath,
  inputName,
  setInputName,
  confirmAdd,
  confirmRename,
  renderTree,
}) {
  const fullPath = [...path, node.name].join("/");
  const isRenaming = renamingPath === fullPath;
  const isExpanded = expandedFolders.has(fullPath);

  const baseClasses = `transition-all duration-200 ease-in-out hover:scale-[1.01] px-2 py-1 rounded flex justify-between items-center text-sm ${
    fullPath === activeFile
      ? "bg-blue-600 text-white shadow-md"
      : "hover:bg-gray-700 text-gray-300"
  }`;

  // ===============================
  // FILE NODE
  // ===============================
  if (node.type === "file") {
    return (
      <div className={`pl-6 ${baseClasses}`}>
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
              <FaSave
                className="text-green-400 cursor-pointer"
                onClick={confirmRename}
              />
              <FaTimes
                className="text-red-400 cursor-pointer"
                onClick={() => setRenamingPath(null)}
              />
            </div>
          </>
        ) : (
          <>
            <div
              onClick={() => onFileClick(fullPath)}
              className="flex items-center gap-2 w-full"
            >
              <FaFile className="text-gray-400" />
              <span className="truncate">{node.name}</span>
            </div>
            <div className="flex gap-1 ml-1">
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
    );
  }

  // ===============================
  // FOLDER NODE
  // ===============================
  return (
    <div className="pl-2 text-sm">
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
              <FaSave
                className="text-green-400 cursor-pointer"
                onClick={confirmRename}
              />
              <FaTimes
                className="text-red-400 cursor-pointer"
                onClick={() => setRenamingPath(null)}
              />
            </div>
          </>
        ) : (
          <>
            <div
              className="flex items-center gap-2 w-full"
              onClick={() => toggleFolder(fullPath)}
            >
              {isExpanded ? <FaFolderOpen /> : <FaFolder />}
              <span className="font-medium text-gray-200">
                {node.name}
              </span>
            </div>
            <div className="flex gap-1">
              <FaPlus
                title="Add File"
                className="text-green-400 cursor-pointer"
                onClick={() =>
                  handleAddClick("file", [...path, node.name])
                }
              />
              <FaPlus
                title="Add Folder"
                className="text-blue-400 cursor-pointer"
                onClick={() =>
                  handleAddClick("folder", [...path, node.name])
                }
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

          {pendingAdd &&
            pendingAdd.path.join("/") === fullPath && (
              <div className="flex items-center gap-1 mt-1">
                <input
                  autoFocus
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAdd();
                    if (e.key === "Escape") setPendingAdd(null);
                  }}
                  className="bg-gray-800 text-white px-2 py-1 rounded w-full outline-none"
                  placeholder={`New ${pendingAdd.type}`}
                />
                <FaSave
                  className="text-green-400 cursor-pointer"
                  onClick={confirmAdd}
                />
                <FaTimes
                  className="text-red-400 cursor-pointer"
                  onClick={() => setPendingAdd(null)}
                />
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default TreeNode;
