import React, { useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";

loader.init().then((monaco) => {
  monaco.languages.register({ id: "python" });
  monaco.languages.register({ id: "java" });
  monaco.languages.register({ id: "cpp" });
  monaco.languages.register({ id: "csharp" });
  monaco.languages.register({ id: "html" });
});

function CodeEditor({ code, onCodeChange, language }) {
  useEffect(() => {}, [language]);

  return (
    <div className="w-full h-full border border-gray-700 rounded-md overflow-hidden shadow-md">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => onCodeChange(value || "")}
        options={{
          fontSize: 16,
          fontLigatures: true,
          fontFamily: "Fira Code, monospace",
          minimap: { enabled: false },
          wordWrap: "on",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 12 },
          roundedSelection: true,
          renderLineHighlight: "gutter",
          lineNumbersMinChars: 4,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}

export default CodeEditor;
