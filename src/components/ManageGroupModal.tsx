import React, { useState, useEffect } from "react";
import { chatApi } from "../api/chat.api";
import type { User, Room } from "../types";
import { X, Search, UserPlus, UserMinus, Loader2, Trash2, Crown } from "lucide-react";

interface ManageGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onRoomUpdated: (updatedRoom: Room) => void;
  onRoomDeleted: (roomId: number) => void;
}

export const ManageGroupModal: React.FC<ManageGroupModalProps> = ({
  isOpen,
  onClose,
  room,
  onRoomUpdated,
  onRoomDeleted,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError("");
      setDeleteConfirm(false);
      chatApi.getUsers()
        .then(setUsers)
        .catch(() => setError("Failed to load user list."))
        .finally(() => setLoading(false));
    }
  }, [isOpen, room]);

  if (!isOpen) return null;

  const currentMemberIds = room.members.map((m) => m.user.id);
  const membersList = room.members.map((m) => m.user);

  // Users who are not in this group
  const nonMembersList = users.filter(
    (u) => !currentMemberIds.includes(u.id) && u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddMember = async (userId: number) => {
    setActionId(userId);
    setError("");
    try {
      const updatedRoom = await chatApi.addRoomMember(room.id, userId);
      onRoomUpdated(updatedRoom);
    } catch (err: any) {
      setError(err.message || "Failed to add member.");
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    setActionId(userId);
    setError("");
    try {
      const updatedRoom = await chatApi.removeRoomMember(room.id, userId);
      onRoomUpdated(updatedRoom);
    } catch (err: any) {
      setError(err.message || "Failed to remove member.");
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteGroup = async () => {
    setLoading(true);
    setError("");
    try {
      await chatApi.deleteRoom(room.id);
      onRoomDeleted(room.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">Manage Group: {room.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="px-5 py-2.5 bg-red-50 border-b border-red-100 text-red-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Current Members Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current Members ({membersList.length})
            </h4>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {membersList.map((u) => {
                const isActionLoading = actionId === u.id;
                return (
                  <div key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs flex-shrink-0">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 text-sm font-semibold">{u.username}</span>
                        {u.is_admin && (
                          <span className="inline-flex text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded font-medium">
                            admin
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!u.is_admin && (
                      <button
                        onClick={() => handleRemoveMember(u.id)}
                        disabled={isActionLoading}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Remove member"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Members Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Add Members
              </h4>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 transition-all text-slate-700 placeholder-slate-400"
              />
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : nonMembersList.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  {search ? "No matches found." : "All users are members of this group."}
                </div>
              ) : (
                nonMembersList.map((u) => {
                  const isActionLoading = actionId === u.id;
                  return (
                    <div key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs flex-shrink-0">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-slate-700 text-sm font-semibold">{u.username}</span>
                      </div>
                      <button
                        onClick={() => handleAddMember(u.id)}
                        disabled={isActionLoading}
                        className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Add member"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-100">
            {!deleteConfirm ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Group Permanently</span>
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-2.5">
                <p className="text-xs text-red-800 font-semibold text-center leading-relaxed">
                  Are you sure you want to permanently delete this group? All messages and attachments will be deleted forever.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    disabled={loading}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes, Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    disabled={loading}
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
