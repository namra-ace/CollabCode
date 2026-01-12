import { motion, AnimatePresence } from "framer-motion";
import CodeEditor from "../../components/editor/CodeEditor";

function EditorWorkspace({
  activeFile,
  fileContent,
  fileLanguage,
  provider,
  yDoc,
  setFileContent,
  cursorRef // 👈 Receive Prop
}) {
  return (
    <div className="flex-grow bg-[#1a1a1d] rounded-lg overflow-hidden shadow-inner">
      <AnimatePresence mode="wait">
        {activeFile && fileContent[activeFile] !== undefined ? (
          <motion.div
            key={activeFile}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <CodeEditor
              key={activeFile}
              activeFile={activeFile}
              initialContent={fileContent[activeFile] || ""}
              yProvider={provider}
              yDoc={yDoc}
              onCodeChange={(newCode) =>
                setFileContent((prev) => ({
                  ...prev,
                  [activeFile]: newCode,
                }))
              }
              language={fileLanguage[activeFile] || "plaintext"}
              cursorRef={cursorRef} // 👈 Pass it down
            />
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full text-gray-500 italic"
          >
            Select or create a file to start coding
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EditorWorkspace;