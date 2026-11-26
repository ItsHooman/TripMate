
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL ||
  "http://localhost:5002";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, authLoading } =
    useContext(AuthContext);

  const userId = String(
    user?.id || user?._id || ""
  );

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadBySender, setUnreadBySender] = useState({});

  const [notificationCount, setNotificationCount] =
    useState(0);

  const requestRef = useRef(0);

  /* REFRESH BADGE COUNTS */

  const refreshCounts = useCallback(async () => {
    if (!userId) return;

    const requestId = ++requestRef.current;
    const token = localStorage.getItem("token");

    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const [messagesResponse, notificationsResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/message/unread`,
            { headers }
          ),

          fetch(
            `${API_BASE_URL}/notifications`,
            { headers }
          ),
        ]);

      const [messagesData, notificationsData] =
        await Promise.all([
          messagesResponse.json(),
          notificationsResponse.json(),
        ]);

      if (requestId !== requestRef.current) {
        return;
      }

      if (messagesResponse.ok) {
        setUnreadCount(messagesData.total || 0);

        setUnreadBySender(
          messagesData.bySender || {}
        );
      }

      if (
        notificationsResponse.ok &&
        Array.isArray(notificationsData)
      ) {
        const unreadNotifications =
          notificationsData.filter(
            (notification) => !notification.read
          );

        setNotificationCount(
          unreadNotifications.length
        );
      }
    } catch (error) {
      console.error("Badge refresh error:", error);
    }
  }, [userId]);

  /* GLOBAL SOCKET CONNECTION */

  useEffect(() => {
    setSocket(null);
    setIsConnected(false);
    setUnreadCount(0);
    setUnreadBySender({});
    setNotificationCount(0);

    if (!userId || authLoading) return;

    const token = localStorage.getItem("token");

    if (!token) return;

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    const handleConnect = () => {
      setIsConnected(true);
      refreshCounts();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      setIsConnected(false);

      console.error(
        "Socket connection error:",
        error.message
      );
    };

    newSocket.on("connect", handleConnect);

    newSocket.on(
      "disconnect",
      handleDisconnect
    );

    newSocket.on(
      "connect_error",
      handleConnectError
    );

    const refreshEvents = [
      "receiveMessage",
      "connectionRequest",
      "connectionAccepted",
      "connectionRemoved",
      "newMatch",
      "messagesRead",
      "notificationsUpdated",
    ];

    refreshEvents.forEach((event) => {
      newSocket.on(event, refreshCounts);
    });

    setSocket(newSocket);

    refreshCounts();

    // Backup refresh if a real-time event is missed.
    const interval = setInterval(
      refreshCounts,
      30000
    );

    return () => {
      requestRef.current += 1;

      clearInterval(interval);

      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [userId, authLoading, refreshCounts]);

  /* MARK CONVERSATION AS READ */

  const markConversationAsRead =
    useCallback(async (senderId) => {
      if (!senderId || !userId) return false;

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/message/read/${senderId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to mark conversation as read."
          );
        }

        await refreshCounts();

        return true;
      } catch (error) {
        console.error(error.message);
        return false;
      }
    }, [userId, refreshCounts]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadCount,
        unreadBySender,
        notificationCount,
        refreshCounts,
        markConversationAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocket must be used inside SocketProvider"
    );
  }

  return context;
}
