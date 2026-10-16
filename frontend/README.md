# 🚀 Streamify - Real-Time Communication Platform

Streamify is a full-stack real-time communication platform built using the MERN stack. It allows users to chat, connect with friends, and make video calls with live updates.

---

## ✨ Features

- 🔐 User Authentication (JWT + Cookies)
- 👥 Friend Request System
- 💬 Real-Time Chat (Socket.io)
- 🎥 Video Calling (WebRTC)
- 🟢 Online/Offline Status
- ⌨️ Typing Indicator
- 👤 Profile Management
- 🎨 Multiple Themes

---

## 🛠️ Tech Stack

**Frontend:**
- React.js
- Tailwind CSS + DaisyUI
- React Query
- Socket.io Client

**Backend:**
- Node.js
- Express.js
- MongoDB
- Socket.io
- JWT Authentication

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

git clone https://github.com/Shubham-exe/streamify.git
cd streamify

### 2️⃣ Setup Backend
cd backend
npm install

Create a .env file in /backend:

PORT=5001
MONGO_URI=your_mongodb_connection
JWT_SECRET_KEY=your_secret_key

Start backend:
npm run dev

### 3️⃣ Setup Frontend
cd ../frontend
npm install

Create a .env file in /frontend:
VITE_STREAM_API_KEY=your_stream_api_key

Start frontend:
npm run dev

Open http://localhost:5173. The dev server proxies API and Socket.IO requests, so you do not open the API port in the browser.