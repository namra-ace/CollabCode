import React, { useEffect, useState, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";

loader.init().then((monaco) => {
  monaco.languages.register({ id: "python" });
  monaco.languages.register({ id: "java" });
  monaco.languages.register({ id: "cpp" });
  monaco.languages.register({ id: "csharp" });
  monaco.languages.register({ id: "html" });
});

function CodeEditor({ initialContent, activeFile, onCodeChange, language, yProvider, yDoc, theme = "vs-dark" }) {
  const [editorRef, setEditorRef] = useState(null);
  const bindingRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    setEditorRef(editor);
  };

  useEffect(() => {
    if (!editorRef || !yProvider || !yDoc) return;

    const yText = yDoc.getText("monaco");

    // ✅ FIX: If Yjs doc is empty (new session), load content from DB
    if (yText.toString() === "" && initialContent) {
      yText.insert(0, initialContent);
    }

    // Clean up old binding
    if (bindingRef.current) bindingRef.current.destroy();

    // Bind Yjs to Monaco
    const binding = new MonacoBinding(
      yText,
      editorRef.getModel(),
      new Set([editorRef]),
      yProvider.awareness
    );
    bindingRef.current = binding;

    // Sync back to React state for "Save" button
    const updateListener = () => {
      onCodeChange(yText.toString());
    };
    yText.observe(updateListener);

    return () => {
      yText.unobserve(updateListener);
      binding.destroy();
      bindingRef.current = null;
    };
  }, [editorRef, yProvider, yDoc, activeFile]); 

  return (
    <div className="w-full h-full border border-gray-700 rounded-md overflow-hidden shadow-md">
      <Editor
        height="100%"
        language={language}
        theme={theme}
        defaultValue="" // Let Yjs handle the value
        onMount={handleEditorDidMount}
        options={{
          fontSize: 16,
          fontLigatures: true,
          fontFamily: "Fira Code, monospace",
          minimap: { enabled: false },
          wordWrap: "on",
          padding: { top: 12 },
        }}
      />
    </div>
  );
}

export default CodeEditor;