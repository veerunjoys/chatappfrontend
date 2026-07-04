import React, { useState, useEffect } from "react";
import { chatApi } from "../api/chat.api";
import type { User, Room } from "../types";
import { X, Search, Users, UserPlus, Loader2, Check } from "lucide-react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: Room) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onRoomCreated }) => {
  const [activeTab, setActiveTab] = useState<"dm" | "group">("dm");
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError("");
      chatApi.getUsers()
        .then(setUsers)
        .catch(() => setError("Failed to load users."))
        .finally(() => setLoading(false));
    } else {
      setGroupName(""); setSelectedUserIds([]); setSearch(""); setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartDM = async (otherUserId: number) => {
    setLoading(true); setError("");
    try {
      const room = await chatApi.getOrCreatePrivateRoom(otherUserId);
      onRoomCreated(room); onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start chat.");
    } finally { setLoading(false); }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) { setError("Enter a group name."); return; }
    if (selectedUserIds.length === 0) { setError("Select at least one member."); return; }
    setLoading(true); setError("");
    try {
      const room = await chatApi.createRoom(groupName.trim(), selectedUserIds);
      onRoomCreated(room); onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create group.");
    } finally { setLoading(false); }
  };

  const toggleUser = (id: number) =>
    setSelectedUserIds((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">New Conversation</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 text-sm">
          <button
            onClick={() => setActiveTab("dm")}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "dm"
                ? "border-indigo-500 text-indigo-600 bg-indigo-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Direct Message
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "group"
                ? "border-indigo-500 text-indigo-600 bg-indigo-50/40"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Group Chat
          </button>
        </div>

        {error && (
          <div className="px-5 py-2.5 bg-red-50 border-b border-red-100 text-red-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-all text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : activeTab === "dm" ? (
            filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">No users found.</div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartDM(u.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm flex-shrink-0">
                    {u.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-700 text-sm group-hover:text-slate-900">
                      {u.username}
                    </div>
                    <div className="text-xs text-slate-400">Click to start chat</div>
                  </div>
                </button>
              ))
            )
          ) : (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Alpha"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 text-slate-800 text-sm placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Members ({selectedUserIds.length} selected)
                </label>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {filteredUsers.map((u) => {
                    const selected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                          selected ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs flex-shrink-0">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-slate-700 text-sm font-medium">{u.username}</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300"
                        }`}>
                          {selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !groupName.trim() || selectedUserIds.length === 0}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Group"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
