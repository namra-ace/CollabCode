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

function CodeEditor({ 
  initialContent, 
  activeFile, 
  onCodeChange, 
  language, 
  yProvider, 
  yDoc, 
  theme = "vs-dark",
  cursorRef // 👈 New Prop
}) {
  const [editorRef, setEditorRef] = useState(null);
  const bindingRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    setEditorRef(editor);
  };

  useEffect(() => {
    if (!editorRef || !yProvider || !yDoc || !activeFile) return;

    const yText = yDoc.getText(activeFile);

    // 1. Pre-fill view
    editorRef.setValue(yText.toString());

    // 2. Bind Yjs to Monaco
    if (bindingRef.current) bindingRef.current.destroy();

    const binding = new MonacoBinding(
      yText,
      editorRef.getModel(),
      new Set([editorRef]),
      yProvider.awareness
    );
    bindingRef.current = binding;

    // ---------------------------------------------------------
    // 3. TRACK CURSOR POSITION (For AI Insert)
    // ---------------------------------------------------------
    const cursorListener = editorRef.onDidChangeCursorPosition((e) => {
      if (cursorRef) {
        // Convert visual position (Line 5, Col 3) to Absolute Index (254)
        const model = editorRef.getModel();
        const offset = model.getOffsetAt(e.position);
        cursorRef.current = offset;
      }
    });

    // 4. Seed content from DB if room is empty
    const handleSync = () => {
      if (yText.toString() === "") {
        if (initialContent) {
           yText.insert(0, initialContent);
        }
      }
    };

    if (yProvider.synced) {
      handleSync();
    } else {
      yProvider.once("synced", handleSync);
    }

    return () => {
      binding.destroy();
      bindingRef.current = null;
      cursorListener.dispose(); // Clean up listener
    };
  }, [editorRef, yProvider, yDoc, activeFile, cursorRef]); // Added cursorRef dependency

  const handleEditorChange = (value) => {
    if (onCodeChange) {
      onCodeChange(value || "");
    }
  };

  return (
    <div className="w-full h-full border border-gray-700 rounded-md overflow-hidden shadow-md relative">
      <Editor
        height="100%"
        language={language}
        theme={theme}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange} 
        options={{
          fontSize: 16,
          fontLigatures: true,
          fontFamily: "Fira Code, monospace",
          minimap: { enabled: false },
          wordWrap: "on",
          padding: { top: 12 },
          automaticLayout: true,
        }}
      />
    </div>
  );
}

export default CodeEditor;