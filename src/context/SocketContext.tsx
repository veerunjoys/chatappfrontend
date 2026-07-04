import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import type { Message } from "../types";
import { API_BASE_URL } from "../api/config";

interface TypingStatus {
  room_id: number;
  user_id: number;
  username: string;
  is_typing: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isRestricted: boolean;
  sendError: string | null;
  clearSendError: () => void;
  sendMessage: (roomId: number, content: string, attachmentUrl?: string, attachmentType?: string) => void;
  emitTyping: (roomId: number, isTyping: boolean) => void;
  typingUsers: { [roomId: number]: string[] };
  incomingMessage: Message | null;
  clearIncomingMessage: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [roomId: number]: string[] }>({});
  const [incomingMessage, setIncomingMessage] = useState<Message | null>(null);

  useEffect(() => {
    // Sync initial restriction status from auth user object
    if (user) setIsRestricted(user.is_restricted ?? false);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) { socket.disconnect(); setSocket(null); }
      setIsConnected(false);
      return;
    }

    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => { console.log("[Socket] Connected"); setIsConnected(true); });
    newSocket.on("disconnect", () => { console.log("[Socket] Disconnected"); setIsConnected(false); });

    newSocket.on("message", (msg: Message) => {
      console.log("[Socket] Received message:", msg);
      setIncomingMessage(msg);
    });

    newSocket.on("typing", (data: TypingStatus) => {
      setTypingUsers((prev) => {
        const list = prev[data.room_id] || [];
        if (data.is_typing) {
          return list.includes(data.username)
            ? prev
            : { ...prev, [data.room_id]: [...list, data.username] };
        }
        return { ...prev, [data.room_id]: list.filter((u) => u !== data.username) };
      });
    });

    // Restriction status updates from admin actions
    newSocket.on("user_restricted", (data: { is_restricted: boolean }) => {
      console.log("[Socket] Restriction update:", data.is_restricted);
      setIsRestricted(data.is_restricted);
    });

    // Blocked message error feedback
    newSocket.on("send_error", (data: { message: string }) => {
      setSendError(data.message);
    });

    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [token, isAuthenticated]);

  const sendMessage = useCallback((roomId: number, content: string, attachmentUrl?: string, attachmentType?: string) => {
    if (socket && isConnected) {
      socket.emit("send_message", {
        room_id: roomId,
        content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      });
    }
  }, [socket, isConnected]);

  const emitTyping = useCallback((roomId: number, isTyping: boolean) => {
    if (socket && isConnected && !isRestricted) socket.emit("typing", { room_id: roomId, is_typing: isTyping });
  }, [socket, isConnected, isRestricted]);

  return (
    <SocketContext.Provider value={{
      socket, isConnected, isRestricted, sendError,
      clearSendError: () => setSendError(null),
      sendMessage, emitTyping, typingUsers,
      incomingMessage, clearIncomingMessage: () => setIncomingMessage(null),
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
