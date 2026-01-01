import { motion } from "framer-motion";

function EditorTabs({
  openTabs,
  activeFile,
  setActiveFile,
  setOpenTabs,
}) {
  return (
    <div className="flex items-center space-x-1 border-b border-gray-800 bg-[#121212] px-2 py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
      {openTabs.map((file) => {
        const isActive = file === activeFile;

        return (
          <motion.div
            key={file}
            layout
            initial={{ opacity: 0.6, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center px-4 py-1 rounded-t-md cursor-pointer transition-colors whitespace-nowrap font-mono text-sm ${
              isActive
                ? "bg-gray-700 text-white font-bold"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => setActiveFile(file)}
          >
            <span title={file}>{file.split("/").pop()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const updatedTabs = openTabs.filter((f) => f !== file);
                setOpenTabs(updatedTabs);
                if (isActive) setActiveFile(updatedTabs.at(-1) || null);
              }}
              className="ml-2 hover:text-red-500"
            >
              ✕
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

export default EditorTabs;
