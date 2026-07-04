import React from "react";
import type { Message } from "../types";
import { useAuth } from "../context/AuthContext";
import { Megaphone } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  showSenderName: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showSenderName }) => {
  const { user } = useAuth();
  const isOwn = message.sender_id === user?.id;

  const formatTime = (iso: string) => {
    try {
      let dateStr = iso;
      if (dateStr && !dateStr.endsWith("Z")) {
        const parts = dateStr.split("T");
        if (parts.length > 1 && !parts[1].includes("+") && !parts[1].includes("-")) {
          dateStr += "Z";
        }
      }
      return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // ── Announcement bubble (system-wide, full width) ──
  if (message.is_announcement) {
    const fullUrl = message.attachment_url
      ? (message.attachment_url.startsWith("http")
        ? message.attachment_url
        : `http://localhost:8000${message.attachment_url}`)
      : "";
    return (
      <div className="flex justify-center my-2">
        <div className="flex items-start gap-2 max-w-lg w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
          <Megaphone className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-700 mb-0.5">Admin Announcement</p>
            {message.content && (
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            )}
            
            {message.attachment_url && message.attachment_type === "image" && (
              <div className="mt-2.5 rounded-lg overflow-hidden border border-amber-200 max-w-full bg-white flex items-center justify-center">
                <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <img src={fullUrl} alt="Announcement" className="max-h-60 w-full object-cover hover:opacity-95 transition-opacity" />
                </a>
              </div>
            )}
            
            {message.attachment_url && message.attachment_type === "voice" && (
              <div className="mt-2.5">
                <audio src={fullUrl} controls className="w-full max-w-xs focus:outline-none" />
              </div>
            )}
            
            <p className="text-[10px] text-amber-500 mt-1">{formatTime(message.created_at)}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular chat bubble ──
  const fullUrl = message.attachment_url
    ? (message.attachment_url.startsWith("http")
      ? message.attachment_url
      : `http://localhost:8000${message.attachment_url}`)
    : "";

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      {showSenderName && !isOwn && (
        <span className="text-[11px] font-semibold text-slate-500 ml-1 mb-1">
          {message.sender_username}
        </span>
      )}
      <div
        className={`max-w-[68%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
          isOwn
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
        }`}
      >
        {message.content && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        )}
        
        {message.attachment_url && message.attachment_type === "image" && (
          <div className={`rounded-lg overflow-hidden max-w-full bg-white flex items-center justify-center border border-slate-100 ${message.content ? "mt-2" : ""}`}>
            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <img src={fullUrl} alt="Message attachment" className="max-h-60 w-full object-cover hover:opacity-95 transition-opacity" />
            </a>
          </div>
        )}
        
        {message.attachment_url && message.attachment_type === "voice" && (
          <div className={`${message.content ? "mt-2" : ""}`}>
            <audio src={fullUrl} controls className="w-full max-w-xs focus:outline-none" />
          </div>
        )}
      </div>
      <span className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(message.created_at)}</span>
    </div>
  );
};
