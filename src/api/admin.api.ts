import type { User, Message } from "../types";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/api/admin`;

const getHeaders = () => {
  const token = localStorage.getItem("chat_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const adminApi = {
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  },

  async toggleRestriction(userId: number, restrict: boolean): Promise<void> {
    const res = await fetch(
      `${API_URL}/users/${userId}/restrict?restrict=${restrict}`,
      { method: "PATCH", headers: getHeaders() }
    );
    if (!res.ok) throw new Error("Failed to update restriction");
  },

  async postAnnouncement(content: string, attachmentUrl?: string, attachmentType?: string): Promise<Message> {
    const res = await fetch(`${API_URL}/announce`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      }),
    });
    if (!res.ok) throw new Error("Failed to post announcement");
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
};
