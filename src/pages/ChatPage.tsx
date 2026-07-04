import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";
import { CreateRoomModal } from "../components/CreateRoomModal";
import type { Room } from "../types";
import { chatApi } from "../api/chat.api";
import { useSocket } from "../context/SocketContext";

export const ChatPage: React.FC = () => {
  const { incomingMessage } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRooms = async () => {
    try {
      const data = await chatApi.getRooms();
      setRooms(data);
      if (selectedRoom) {
        const updatedSelected = data.find((r) => r.id === selectedRoom.id);
        if (updatedSelected) setSelectedRoom(updatedSelected);
      }
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    if (incomingMessage) {
      const roomExists = rooms.some((r) => r.id === incomingMessage.room_id);
      if (!roomExists) fetchRooms();
    }
  }, [incomingMessage, rooms]);

  const handleRoomCreated = (newRoom: Room) => {
    setRooms((prev) => {
      if (prev.some((r) => r.id === newRoom.id)) return prev;
      return [...prev, newRoom];
    });
    setSelectedRoom(newRoom);
  };

  const handleRoomUpdated = (updatedRoom: Room) => {
    setRooms((prev) => prev.map((r) => r.id === updatedRoom.id ? updatedRoom : r));
    setSelectedRoom(updatedRoom);
  };

  const handleRoomDeleted = (roomId: number) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setSelectedRoom(null);
  };

  return (
    <div className="h-screen w-screen flex bg-slate-50 overflow-hidden text-slate-800">
      <Sidebar
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        onOpenNewChat={() => setIsModalOpen(true)}
      />
      <ChatWindow
        selectedRoom={selectedRoom}
        onRoomUpdated={handleRoomUpdated}
        onRoomDeleted={handleRoomDeleted}
      />
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
};
