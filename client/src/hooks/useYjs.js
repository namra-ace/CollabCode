import { useEffect, useState, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const useYjs = (roomId, activeFile) => {
  const [provider, setProvider] = useState(null);
  const [yDoc, setYDoc] = useState(null);

  useEffect(() => {
    if (!roomId || !activeFile) return;

    const docId = `${roomId}-${activeFile}`;

    // 1. Create the Yjs Doc
    const doc = new Y.Doc();

    // 2. Connect to the WebSocket Server
    // We point to the same host/port as your backend, but with 'ws://'
    // The path '/yjs/' matches the upgrade logic we added to server.js
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const wsUrl = backendUrl.replace(/^http/, 'ws') + `/yjs/${docId}`;

    const wsProvider = new WebsocketProvider(
      wsUrl, // The URL string directly (y-websocket constructs the rest)
      docId, // The room name
      doc,   // The doc instance
      { connect: true }
    );

    setYDoc(doc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      doc.destroy();
    };
  }, [roomId, activeFile]);

  return { provider, yDoc };
};