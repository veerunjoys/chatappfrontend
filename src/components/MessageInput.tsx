import React, { useState, useRef, useEffect } from "react";
import { Send, Plus, Mic, Volume2, X, Square, Loader2 } from "lucide-react";
import { chatApi } from "../api/chat.api";
import { API_BASE_URL } from "../api/config";

interface MessageInputProps {
  onSendMessage: (content: string, attachmentUrl?: string, attachmentType?: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
  disableAttachments?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTypingChange,
  disabled = false,
  disableAttachments = false
}) => {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  // Attachment state
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<"image" | "voice" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  const startRecording = async () => {
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([audioBlob], "voice_note.webm", { type: "audio/webm" });

        await handleUpload(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setUploadError("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.stop();
      setRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await chatApi.uploadFile(file);
      setAttachmentUrl(res.url);
      setAttachmentType(res.type);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentType(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachmentUrl) return;

    onSendMessage(content.trim(), attachmentUrl || undefined, attachmentType || undefined);
    setContent("");
    setAttachmentUrl(null);
    setAttachmentType(null);

    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    onTypingChange(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      onTypingChange(true);
    }
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      onTypingChange(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white flex flex-col">
      {/* Upload Error banner */}
      {uploadError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-600 font-medium flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Attachment Previews */}
      {attachmentUrl && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {attachmentType === "image" ? (
              <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                <img src={`${API_BASE_URL}${attachmentUrl}`} alt="Upload preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 capitalize">{attachmentType} Attached</p>
              <p className="text-[10px] text-slate-400 truncate max-w-xs">{attachmentUrl}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeAttachment}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Recording overlay */}
      {recording && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold text-red-700">
              Recording voice: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={stopRecording}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
            <button
              type="button"
              onClick={cancelRecording}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 flex items-center gap-2.5"
      >
        {/* Plus Button */}
        {!disabled && !disableAttachments && !recording && (
          <label className="cursor-pointer p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl transition-all shadow-sm border border-slate-100 flex-shrink-0 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <input
              type="file"
              accept="image/*,audio/*"
              onChange={handleFileChange}
              disabled={uploading || disabled}
              className="hidden"
            />
          </label>
        )}

        <input
          type="text"
          placeholder={disabled ? "You are restricted from sending messages" : "Type a message…"}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || recording}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all text-slate-800 placeholder-slate-400 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
        />

        {/* Mic Button */}
        {!disabled && !disableAttachments && !recording && !content.trim() && !attachmentUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="p-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-colors shadow-sm flex-shrink-0 flex items-center justify-center"
          >
            <Mic className="w-4 h-4 text-red-500" />
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || uploading || (!content.trim() && !attachmentUrl)}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
