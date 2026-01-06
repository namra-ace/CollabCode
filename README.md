# 🚀 CodeSync

A **real-time collaborative code editor** with **role-based access control (RBAC)**, built from scratch using **React, Node.js, Socket.IO, Yjs, and MongoDB**.

CodeSync is not a Google Docs clone glued together with libraries — it is a **deeply engineered collaborative system** that enforces permissions consistently across **REST APIs, WebSockets, Socket.IO events, and CRDT synchronization**.

---

## 🧠 Why CodeSync?

Most collaborative editors fail at one critical thing:
> **Security and consistency across real-time channels**.

CodeSync solves this by ensuring:
- Guests can **see everything** but **edit nothing**
- Editors can collaborate **live and safely**
- Owners retain **full control**
- Permissions are enforced **server-side**, not via UI tricks

No fake locks. No trust in the client. No accidental writes.

---

## ✨ Key Features

### 🔐 Role-Based Access Control (RBAC)
- **Owner** – Full control (create room, edit, invite)
- **Editor** – Can edit files after passcode verification
- **Guest** – Read-only access (no edits, no saves)

RBAC is enforced at **every layer**:
- REST APIs  
- Socket.IO events  
- Yjs WebSocket updates  

---

### ⚡ Real-Time Collaborative Editing
- Powered by **Yjs (CRDT-based synchronization)**
- Live multi-user editing with conflict-free updates
- Cursor and presence awareness
- Zero race conditions, zero merge conflicts

---

### 🧩 File & Folder Tree Collaboration
- Create, rename, delete files & folders
- Fully synced across all connected editors
- Structural updates broadcast via Socket.IO
- Guests are **hard-blocked** from mutating structure

---

### 🛡️ Write-Protected Read-Only Mode
- Guests can:
  - View files
  - Watch live edits
  - Navigate project structure

- Guests **cannot**:
  - Type in editor
  - Modify files
  - Trigger saves
  - Send Yjs updates

This is enforced **server-side**, not via disabled buttons.

---

### 🔑 Passcode-Based Editor Access
- Each room generates a **4-digit passcode**
- Entering the correct passcode upgrades a user to **Editor**
- Owner is always auto-added as editor (self-healing RBAC)

---

### 💾 Auto-Save & Manual Save
- Automatic persistence every few seconds
- Manual save button for editors
- Guests cannot trigger save operations

---

### 📦 Project Download
- Download the entire project as a ZIP
- Preserves folder structure and files
- Public read access

---

### 👥 Live Presence & Active Users
- See who is currently in the room
- Real-time join/leave updates
- Visual distinction between self and others

---

## 🏗️ Architecture Overview

```
Client (React)
   ├── REST API (Express)
   ├── Socket.IO (Presence + File Tree)
   └── WebSocket (Yjs CRDT Sync)

Backend (Node.js)
   ├── Express Server
   ├── MongoDB (Persistence)
   ├── Socket.IO Server
   └── Custom Yjs WebSocket Server
```

Each channel enforces RBAC **independently**.

---

## 🔐 RBAC Enforcement Strategy

### 1️⃣ REST API Layer
- JWT authentication
- Optional auth for read-only routes
- Backend computes `isOwner` and `canEdit`

### 2️⃣ Socket.IO Layer
- Token verified on room join
- Write access stored per socket
- Mutating events blocked for guests

### 3️⃣ Yjs WebSocket Layer
- Custom WS upgrade handler
- JWT + room permission check
- Read-only enforced at protocol level

Even a malicious client **cannot write**.

---

## 🧠 Frontend State Management
- Modular custom hooks
- Single source of truth for permissions
- UI adapts automatically to role

---

## 🧰 Tech Stack

**Frontend**
- React
- Monaco Editor
- Yjs
- Socket.IO Client
- Tailwind CSS

**Backend**
- Node.js
- Express
- MongoDB
- Socket.IO
- ws (WebSocket)
- JWT Authentication

---

## 🚀 Getting Started

```bash
git clone https://github.com/your-username/codesync.git
cd codesync
npm install
npm run dev
```

---

## 🧭 Future Enhancements
- Role management UI
- Live role upgrades
- Code execution sandbox
- Persistent Yjs storage

---

## 🏁 Final Notes

CodeSync is a **systems-level project**, not a UI demo.

It demonstrates:
- Real-time systems design
- Secure RBAC enforcement
- WebSocket protocol control
- CRDT-based collaboration

If you’re a recruiter or engineer:
> This project was built to **scale correctly**, not just work.
