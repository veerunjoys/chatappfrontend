import React, { useEffect, useState, useRef } from "react";
import type { Room, Message } from "../types";
import { chatApi } from "../api/chat.api";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, Users, Globe, Loader2, ShieldBan, X, Settings } from "lucide-react";
import { ManageGroupModal } from "./ManageGroupModal";

interface ChatWindowProps {
  selectedRoom: Room | null;
  onRoomUpdated?: (updatedRoom: Room) => void;
  onRoomDeleted?: (roomId: number) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedRoom,
  onRoomUpdated,
  onRoomDeleted
}) => {
  const { user } = useAuth();
  const { sendMessage, emitTyping, typingUsers, incomingMessage, clearIncomingMessage,
          isRestricted, sendError, clearSendError } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedRoom) return;
    setLoading(true);
    chatApi.getMessages(selectedRoom.id)
      .then(setMessages)
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setLoading(false));
  }, [selectedRoom]);

  useEffect(() => {
    if (incomingMessage && selectedRoom && incomingMessage.room_id === selectedRoom.id) {
      setMessages((prev) =>
        prev.some((m) => m.id === incomingMessage.id) ? prev : [...prev, incomingMessage]
      );
      clearIncomingMessage();
    }
  }, [incomingMessage, selectedRoom, clearIncomingMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm mb-5">
          <MessageSquare className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
        <p className="text-slate-400 text-sm mt-1.5 text-center max-w-xs">
          Choose from the sidebar or start a new direct message or group.
        </p>
      </div>
    );
  }

  const getRoomDisplayName = () => {
    if (selectedRoom.is_group && selectedRoom.name) return selectedRoom.name;
    const other = selectedRoom.members.find((m) => m.user.id !== user?.id);
    return other ? other.user.username : "Private Chat";
  };

  const getRoomIcon = () => {
    if (selectedRoom.name === "Global Chat") return <Globe className="w-4 h-4 text-indigo-500" />;
    if (selectedRoom.is_group) return <Users className="w-4 h-4 text-teal-500" />;
    return <MessageSquare className="w-4 h-4 text-violet-500" />;
  };

  const activeTypists = typingUsers[selectedRoom.id] || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">{getRoomIcon()}</div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">{getRoomDisplayName()}</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedRoom.is_group ? `${selectedRoom.members.length} members` : "Direct message"}
            </p>
          </div>
        </div>

        {selectedRoom.is_group && user?.is_admin && (
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Group</span>
          </button>
        )}
      </div>

      {/* Restriction banner */}
      {isRestricted && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <ShieldBan className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            You have been restricted by an admin. You cannot send messages.
          </p>
        </div>
      )}

      {/* Send error toast */}
      {sendError && (
        <div className="px-5 py-2.5 bg-orange-50 border-b border-orange-200 flex items-center justify-between gap-2">
          <p className="text-xs text-orange-700 font-medium">{sendError}</p>
          <button onClick={clearSendError} className="text-orange-400 hover:text-orange-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-400">Loading messages…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <p>No messages yet.</p>
            <p className="text-xs text-slate-300 mt-1">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const showName =
              selectedRoom.is_group &&
              (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
            return <MessageBubble key={msg.id} message={msg} showSenderName={showName} />;
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {activeTypists.length > 0 && (
        <div className="px-5 py-1.5 bg-white border-t border-slate-100 text-xs text-indigo-500 font-medium">
          {activeTypists.join(", ")} {activeTypists.length === 1 ? "is" : "are"} typing…
        </div>
      )}

      {/* Input — disabled when restricted */}
      <MessageInput
        onSendMessage={(content, url, type) => sendMessage(selectedRoom.id, content, url, type)}
        onTypingChange={(isTyping) => emitTyping(selectedRoom.id, isTyping)}
        disabled={isRestricted}
        disableAttachments={selectedRoom.is_group && !user?.is_admin}
      />

      {/* Group Management Modal */}
      {isManageModalOpen && (
        <ManageGroupModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          room={selectedRoom}
          onRoomUpdated={(updated) => onRoomUpdated?.(updated)}
          onRoomDeleted={(deletedId) => onRoomDeleted?.(deletedId)}
        />
      )}
    </div>
  );
};
