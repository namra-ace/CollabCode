import TreeNode from "./TreeNode";
import { useSidebarState } from "./useSidebarState";
import { FaSave, FaTimes } from "react-icons/fa";

function ProjectSidebar({
  structure,
  activeFile,
  onFileClick,
  onAddNode,
  onRenameNode,
  onDeleteNode,
}) {
  const {
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
  } = useSidebarState({
    structure,
    onAddNode,
    onRenameNode,
  });

  // ===============================
  // Recursive Tree Renderer
  // ===============================
  const renderTree = (nodes, path = []) =>
    nodes.map((node) => (
      <TreeNode
        key={[...path, node.name].join("/")}
        node={node}
        path={path}
        activeFile={activeFile}
        expandedFolders={expandedFolders}
        toggleFolder={toggleFolder}
        onFileClick={onFileClick}
        onDeleteNode={onDeleteNode}
        onRenameNode={onRenameNode}
        handleAddClick={handleAddClick}
        pendingAdd={pendingAdd}
        setPendingAdd={setPendingAdd}
        renamingPath={renamingPath}
        setRenamingPath={setRenamingPath}
        inputName={inputName}
        setInputName={setInputName}
        confirmAdd={confirmAdd}
        confirmRename={confirmRename}
        renderTree={renderTree}
      />
    ));

  // ===============================
  // Render
  // ===============================
  return (
    <div className="w-64 h-full overflow-y-auto border-r border-gray-700 p-4 bg-black/40 backdrop-blur-md shadow-lg rounded-r-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-300 font-bold text-sm uppercase tracking-wide">
          Project
        </span>
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

      {pendingAdd && pendingAdd.path.length === 0 && (
        <div className="flex items-center gap-1 mt-2">
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
  );
}

export default ProjectSidebar;
