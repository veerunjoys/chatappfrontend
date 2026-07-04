export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  is_restricted: boolean;
  created_at: string;
}

export interface RoomMember {
  user: User;
}

export interface Room {
  id: number;
  name: string | null;
  is_group: boolean;
  created_at: string;
  members: RoomMember[];
}

export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  is_announcement: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
