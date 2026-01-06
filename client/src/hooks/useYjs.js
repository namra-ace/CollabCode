import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const useYjs = (roomId, activeFile, { token } = {}) => {
  const [provider, setProvider] = useState(null);
  const [yDoc, setYDoc] = useState(null);

  useEffect(() => {
    if (!roomId || !activeFile) return;

    const docId = `${roomId}-${activeFile}`;
    const doc = new Y.Doc();

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const wsBaseUrl = backendUrl.replace(/^http/, 'ws') + '/yjs';
    
    const params = new URLSearchParams();
    params.append("roomId", roomId);
    if (token) params.append("token", token);
    
    // Trick: Append params to the Room Name
    const roomNameWithParams = `${docId}?${params.toString()}`;

    const wsProvider = new WebsocketProvider(
      wsBaseUrl, 
      roomNameWithParams, 
      doc,   
      { connect: true }
    );

    setYDoc(doc);
    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
      doc.destroy();
    };
  }, [roomId, activeFile, token]);

  return { provider, yDoc };
};