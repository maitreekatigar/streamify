import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import useAuthUser from "../hooks/useAuthUser";
import { getSocketUrl } from "../lib/config";
import { SocketContext } from "../context/socket-context";

// React StrictMode mounts, unmounts, then mounts again. Disconnecting
// immediately on that first cleanup drops the user offline and opens a second
// connection. Reuse one socket and only disconnect if it stays unused.
let sharedSocket = null;
let sharedUserId = null;
let disconnectTimer = null;

function releaseSharedSocket() {
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }
  sharedSocket?.disconnect();
  sharedSocket = null;
  sharedUserId = null;
}

const SocketProvider = ({ children }) => {
  const { authUser } = useAuthUser();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const userId = authUser?._id;
    if (!userId) {
      releaseSharedSocket();
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const socketUrl = getSocketUrl();
    if (!socketUrl) return;

    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
    }

    if (!sharedSocket || sharedUserId !== userId) {
      sharedSocket?.disconnect();
      sharedSocket = io(socketUrl, {
        query: { userId },
        withCredentials: true,
      });
      sharedUserId = userId;
    }

    setSocket(sharedSocket);
    const onOnline = (users) => setOnlineUsers(Array.isArray(users) ? users : []);
    sharedSocket.on("getOnlineUsers", onOnline);

    return () => {
      sharedSocket?.off("getOnlineUsers", onOnline);
      const current = sharedSocket;
      const currentUserId = sharedUserId;
      disconnectTimer = setTimeout(() => {
        if (sharedSocket === current && sharedUserId === currentUserId) {
          releaseSharedSocket();
        }
      }, 400);
    };
  }, [authUser?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
