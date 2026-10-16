import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

if (!process.env.JWT_SECRET_KEY && process.env.NODE_ENV !== "production") {
  process.env.JWT_SECRET_KEY = "dev-only-streamify-secret";
}

const app = express();
const PORT = process.env.PORT || 5001;
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:43123",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:43123",
  "https://streamify-topaz-chi.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

export function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  if (process.env.NODE_ENV !== "production") {
    try {
      const { hostname } = new URL(origin);
      if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    } catch {
      return false;
    }
  }

  return false;
}

const corsOrigin = (origin, callback) => {
  if (isOriginAllowed(origin)) callback(null, true);
  else callback(new Error("Not allowed by CORS"));
};

app.set("trust proxy", 1);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  console.log("User connected:", userId, socket.id);

  if (userId) {
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).push(socket.id);
    } else {
      onlineUsers.set(userId, [socket.id]);
    }
  }

  io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

  socket.on("disconnect", () => {
    console.log("User disconnected:", userId, socket.id);

    if (userId && onlineUsers.has(userId)) {
      const sockets = onlineUsers.get(userId).filter((id) => id !== socket.id);

      if (sockets.length > 0) {
        onlineUsers.set(userId, sockets);
      } else {
        onlineUsers.delete(userId);
      }
    }

    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
  });
});

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(backendDir, "../frontend/dist");
  app.use(express.static(frontendDist));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
