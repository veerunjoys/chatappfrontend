import type { Room, Message, User } from "../types";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/api/chats`;

const getHeaders = () => {
  const token = localStorage.getItem("chat_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const chatApi = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  },

  async getRooms(): Promise<Room[]> {
    const res = await fetch(`${API_URL}/rooms`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load rooms");
    return res.json();
  },

  async createRoom(name: string, memberIds: number[]): Promise<Room> {
    const res = await fetch(`${API_URL}/rooms`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, is_group: true, member_ids: memberIds }),
    });
    if (!res.ok) throw new Error("Failed to create room");
    return res.json();
  },

  async getOrCreatePrivateRoom(otherUserId: number): Promise<Room> {
    const res = await fetch(`${API_URL}/rooms/private?other_user_id=${otherUserId}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to start private chat");
    return res.json();
  },

  async getMessages(roomId: number): Promise<Message[]> {
    const res = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  async uploadFile(file: File): Promise<{ url: string; type: "image" | "voice" }> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("chat_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to upload file");
    }
    return res.json();
  },

  async addRoomMember(roomId: number, userId: number): Promise<Room> {
    const res = await fetch(`${API_URL}/rooms/${roomId}/members?user_id=${userId}`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to add member to group");
    }
    return res.json();
  },

  async removeRoomMember(roomId: number, userId: number): Promise<Room> {
    const res = await fetch(`${API_URL}/rooms/${roomId}/members/${userId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to remove member from group");
    }
    return res.json();
  },

  async deleteRoom(roomId: number): Promise<void> {
    const res = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to delete room");
    }
  },
};
