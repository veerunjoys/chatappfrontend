import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api/admin.api";
import type { User } from "../types";
import {
  Users, ShieldBan, ShieldCheck, Loader2, Megaphone,
  ArrowLeft, AlertTriangle, CheckCircle2, Crown,
  Image, Mic, Volume2, X, Square
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [restrictingId, setRestrictingId] = useState<number | null>(null);

  const [announcement, setAnnouncement] = useState("");
  const [posting, setPosting] = useState(false);
  const [announceStatus, setAnnounceStatus] = useState<"success" | "error" | null>(null);
  const [announceMsg, setAnnounceMsg] = useState("");

  // Attachment state
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<"image" | "voice" | null>(null);
  const [uploading, setUploading] = useState(false);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
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
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setAnnounceStatus("error");
      setAnnounceMsg("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.onstop = () => {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setAnnounceStatus(null);
    try {
      const res = await adminApi.uploadFile(file);
      setAttachmentUrl(res.url);
      setAttachmentType(res.type);
    } catch (err: any) {
      setAnnounceStatus("error");
      setAnnounceMsg(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentType(null);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleRestriction = async (u: User) => {
    setRestrictingId(u.id);
    try {
      await adminApi.toggleRestriction(u.id, !u.is_restricted);
      setUsers((prev) =>
        prev.map((p) => p.id === u.id ? { ...p, is_restricted: !u.is_restricted } : p)
      );
    } catch {
      // ignore
    } finally {
      setRestrictingId(null);
    }
  };

  const handleAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.trim() && !attachmentUrl) return;
    setPosting(true);
    setAnnounceStatus(null);
    try {
      await adminApi.postAnnouncement(
        announcement.trim(),
        attachmentUrl || undefined,
        attachmentType || undefined
      );
      setAnnounceStatus("success");
      setAnnounceMsg("Announcement posted to Global Chat!");
      setAnnouncement("");
      setAttachmentUrl(null);
      setAttachmentType(null);
    } catch (err: any) {
      setAnnounceStatus("error");
      setAnnounceMsg(err.message || "Failed to post announcement.");
    } finally {
      setPosting(false);
      setTimeout(() => setAnnounceStatus(null), 4000);
    }
  };

  const totalUsers = users.length;
  const restrictedCount = users.filter((u) => u.is_restricted).length;
  const adminCount = users.filter((u) => u.is_admin).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top nav bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-800 text-sm">Admin Panel</span>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Logged in as <span className="font-semibold text-indigo-600">{currentUser?.username}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Users", value: totalUsers, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Admins", value: adminCount, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Restricted", value: restrictedCount, color: "text-red-600", bg: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white shadow-sm`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Announcement composer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Post Announcement</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Announcements are broadcast to <span className="font-semibold text-slate-600">Global Chat</span> for all users.
          </p>
          <form onSubmit={handleAnnounce} className="space-y-3">
            <textarea
              rows={3}
              placeholder="Type your announcement here…"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 resize-none"
            />

            {/* Attachment preview */}
            {attachmentUrl && (
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {attachmentType === "image" ? (
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center">
                      <img src={`http://localhost:8000${attachmentUrl}`} alt="Upload preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Volume2 className="w-5 h-5 text-indigo-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 capitalize">{attachmentType} Attachment</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{attachmentUrl}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Recording Controls */}
            {recording && (
              <div className="flex items-center justify-between p-3 border border-red-200 bg-red-50/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                  <span className="text-xs font-semibold text-red-700">
                    Recording voice: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
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

            {/* Media upload buttons */}
            {!attachmentUrl && !recording && (
              <div className="flex items-center gap-2 pt-1">
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold shadow-sm transition-colors">
                  <Image className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Attach Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e)}
                    className="hidden"
                  />
                </label>
                
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold shadow-sm transition-colors">
                  <Volume2 className="w-3.5 h-3.5 text-teal-500" />
                  <span>Attach Audio</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileChange(e)}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <Mic className="w-3.5 h-3.5 text-red-500" />
                  <span>Record Voice</span>
                </button>
                
                {uploading && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Uploading media…</span>
                  </div>
                )}
              </div>
            )}

            {announceStatus && (
              <div className={`flex items-center gap-2 text-xs font-medium ${
                announceStatus === "success" ? "text-emerald-600" : "text-red-500"
              }`}>
                {announceStatus === "success"
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <AlertTriangle className="w-4 h-4" />}
                {announceMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={posting || uploading || (!announcement.trim() && !attachmentUrl)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              {posting ? "Posting…" : "Post to Global Chat"}
            </button>
          </form>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">All Users</h2>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading users…
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">User</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Joined</th>
                  <th className="text-right px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs flex-shrink-0">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{u.username}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-slateigo-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">you</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          <Crown className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Member</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {u.is_restricted ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                          <ShieldBan className="w-3 h-3" /> Restricted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          <ShieldCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!u.is_admin && u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleRestriction(u)}
                          disabled={restrictingId === u.id}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            u.is_restricted
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          } disabled:opacity-50`}
                        >
                          {restrictingId === u.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : u.is_restricted ? (
                            <><ShieldCheck className="w-3 h-3" /> Unrestrict</>
                          ) : (
                            <><ShieldBan className="w-3 h-3" /> Restrict</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
