import React, { useState } from "react";
import type { Room } from "../types";
import { MessageSquarePlus, LogOut, Search, MessageSquare, Users, Globe, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  rooms: Room[];
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onOpenNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ rooms, selectedRoom, onSelectRoom, onOpenNewChat }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const getRoomDisplayName = (room: Room) => {
    if (room.is_group && room.name) return room.name;
    const otherMember = room.members.find((m) => m.user.id !== user?.id);
    return otherMember ? otherMember.user.username : "Private Chat";
  };

  const getRoomIcon = (room: Room) => {
    if (room.name === "Global Chat") return <Globe className="w-4 h-4 text-indigo-500" />;
    if (room.is_group) return <Users className="w-4 h-4 text-teal-500" />;
    return <MessageSquare className="w-4 h-4 text-violet-500" />;
  };

  const filteredRooms = rooms.filter((room) =>
    getRoomDisplayName(room).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
            {user?.username.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800 text-sm">{user?.username}</span>
              {user?.is_admin && (
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-400">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenNewChat} title="New Chat" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button onClick={logout} title="Log Out" className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Label */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Conversations</span>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No conversations yet</div>
        ) : (
          filteredRooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  isSelected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className={`p-1.5 rounded-md flex-shrink-0 ${isSelected ? "bg-indigo-100" : "bg-slate-100"}`}>
                  {getRoomIcon(room)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{getRoomDisplayName(room)}</div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {room.is_group ? "Group" : "Direct message"}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Admin Panel link — only shown to admins */}
      {user?.is_admin && (
        <div className="px-3 py-3 border-t border-slate-100">
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition-colors text-sm font-medium"
          >
            <Crown className="w-4 h-4 text-amber-500" />
            Admin Panel
          </button>
        </div>
      )}
    </div>
  );
};
