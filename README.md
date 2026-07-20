# Chime — Real-Time Chat App (Frontend)

Chime is a full-stack real-time messaging app: 1-to-1 chats, group chats, a global room every user lands in, an admin panel for moderation, and live typing/attachment support over WebSockets.

This repo is the **frontend** (React + TypeScript + Vite). The API/WebSocket server lives in a separate repo: **[chat-app-backend-](https://github.com/veerunjoys/chat-app-backend-)**.

- **Live app:** https://chatappfrontend-git-main-veerunjoys-projects.vercel.app
- **Live API:** https://chat-app-backend-1v64.onrender.com

## Why this project exists

The goal was to build a Slack/WhatsApp-style chat product from scratch — real accounts, real-time delivery, group/admin moderation — to practice wiring a React SPA to a FastAPI + Socket.IO backend with JWT auth end to end, and to actually ship it (Vercel + Render + Supabase Postgres) rather than leave it as a local demo.

## Features

- **Auth** — register/login with JWT; the very first user to register automatically becomes admin.
- **Global Chat** — every new user is auto-joined to a shared room on register/login.
- **Private (1-to-1) chats** — pick any user from the sidebar to open/create a direct room.
- **Group chats** — create named groups with selected members.
- **Real-time messaging** — Socket.IO delivers messages, typing indicators, and admin actions live, no polling.
- **Attachments** — image and voice-note uploads; in group chats, only admins can post attachments (kept as a moderation choke point).
- **Admin panel** — list all users, restrict/unrestrict a user's ability to send messages (pushed to them live via socket), and broadcast announcements into Global Chat.
- **Restricted-user handling** — a restricted user's send attempts are rejected server-side and surfaced back to them in real time.

## Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | React 19 + TypeScript |
| Build tool | Vite |
| Styling    | Tailwind CSS 4 |
| Routing    | React Router 7 |
| Real-time  | socket.io-client |
| Icons      | lucide-react |
| Lint       | oxlint |

## How it fits together (execution flow)

1. **Login/Register** ([LoginPage.tsx](src/pages/LoginPage.tsx) / [RegisterPage.tsx](src/pages/RegisterPage.tsx)) call the REST API (`/api/auth/*`), get back a JWT, and store the session via [AuthContext](src/context/AuthContext.tsx).
2. **Socket connection** ([SocketContext.tsx](src/context/SocketContext.tsx)) authenticates a single Socket.IO connection using that JWT (`auth: { token }`), then stays open for the life of the session.
3. **ChatPage** ([ChatPage.tsx](src/pages/ChatPage.tsx)) drives the main UI:
   - [Sidebar.tsx](src/components/Sidebar.tsx) lists rooms (Global Chat, private chats, groups) fetched from `/api/chats/rooms`.
   - [ChatWindow.tsx](src/components/ChatWindow.tsx) + [MessageBubble.tsx](src/components/MessageBubble.tsx) render history (`GET /api/chats/rooms/{id}/messages`) and append live messages pushed over the socket (`message` event).
   - [MessageInput.tsx](src/components/MessageInput.tsx) emits `send_message` over the socket (optionally after uploading a file via `POST /api/chats/upload`) and emits `typing` events.
   - [CreateRoomModal.tsx](src/components/CreateRoomModal.tsx) / [ManageGroupModal.tsx](src/components/ManageGroupModal.tsx) handle group creation and membership management.
4. **AdminPage** ([AdminPage.tsx](src/pages/AdminPage.tsx)) — visible only to admins — lists users, toggles restrictions, and posts announcements, all reflected live to affected clients via socket events (`user_restricted`, `message`).
5. All REST calls funnel through one Axios/fetch base configured in [api/config.ts](src/api/config.ts) (`VITE_API_BASE_URL`), so switching between local and deployed backend is a single env var.

## Environment variables

| File | Var | Purpose |
|------|-----|---------|
| `.env.development` | `VITE_API_BASE_URL` | Backend URL used by `npm run dev` (defaults to `http://localhost:8000`) |
| `.env.production` | `VITE_API_BASE_URL` | Backend URL baked into `npm run build` (the deployed Render URL) |

Both files are intentionally **not** gitignored (see `.gitignore`) since Vite needs them at build time and they contain no secrets — only public API URLs.

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173, talks to http://localhost:8000
```

Requires the [backend](https://github.com/veerunjoys/chat-app-backend-) running locally (or pointing `.env.development` at the deployed API) and that backend's `ALLOWED_ORIGINS` to include `http://localhost:5173` for CORS.

```bash
npm run build     # production build using .env.production
npm run preview   # preview the production build locally
npm run lint      # oxlint
```
