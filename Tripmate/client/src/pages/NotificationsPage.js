import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

import { AuthContext } from "../context/AuthContext";
import "../styles/NotificationPage.css";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const { user, loading } = useContext(AuthContext);
  const userId = user?.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/${userId}`);
        const data = await response.json();
        const safeData = Array.isArray(data) ? data : [];
        setNotifications(safeData);
        localStorage.setItem("notifications", JSON.stringify(safeData));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!userId || loading) return;

    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });

    socket.emit("registerUser", userId);

    socket.on("connectionRequest", (data) => {
      const { senderId, user } = data;

      setNotifications((prev) => {
        const updated = [
          ...prev,
          {
            type: "connectionRequest",
            senderId,
            senderName: user?.name || "Anonymous",
            message: `${user?.name || "Someone"} wants to connect with you.`,
            read: false,
          },
        ];

        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });
    });

    socket.on("connectionAccepted", (data) => {
      const { senderName } = data;

      setNotifications((prev) => {
        const updated = prev.filter((notif) => notif.senderName !== senderName);
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.off("connectionRequest");
      socket.off("connectionAccepted");
      socket.disconnect();
    };
  }, [userId, loading]);

  const handleConnect = async (senderId, senderName) => {
    if (!userId) return;

    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socket.emit("acceptConnection", { senderId, userId });

    try {
      const response = await fetch(`${API_BASE_URL}/matche/users/${senderId}`);
      const senderProfile = await response.json();

      setNotifications((prev) => {
        const updated = prev.filter((notif) => notif.senderId !== senderId);
        localStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });

      const storedUsers =
        JSON.parse(localStorage.getItem("connectedUsers")) || [];

      const alreadyExists = storedUsers.some((user) => user._id === senderId);

      const updatedConnectedUsers = alreadyExists
        ? storedUsers
        : [
            ...storedUsers,
            {
              _id: senderId,
              profile: {
                name: senderName,
                profilePicture: senderProfile.profile?.profilePicture,
              },
            },
          ];

      localStorage.setItem(
        "connectedUsers",
        JSON.stringify(updatedConnectedUsers)
      );

      navigate("/messages", {
        state: {
          connectedUsers: updatedConnectedUsers,
          currentUserId: userId,
        },
      });
    } catch (error) {
      console.error("Error accepting connection:", error);
    } finally {
      socket.disconnect();
    }
  };

  const handleIgnore = (senderId) => {
    setNotifications((prev) => {
      const updated = prev.filter((notif) => notif.senderId !== senderId);
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AppShell className="notification-page">
      <div className="app-page notification-page-inner">
        <h2 className="page-title">Notifications</h2>

        {notifications.length === 0 ? (
          <p className="notification-empty-text">No new notifications</p>
        ) : (
          notifications.map((notif, index) => (
            <div
              key={index}
              className={`notification ${notif.read ? "read" : "unread"}`}
            >
              <p>{notif.message}</p>

              {notif.type === "connectionRequest" && (
                <div className="action-buttons">
                  <button
                    className="connect-button"
                    onClick={() =>
                      handleConnect(notif.senderId, notif.senderName)
                    }
                  >
                    Connect
                  </button>

                  <button
                    className="ignore-button"
                    onClick={() => handleIgnore(notif.senderId)}
                  >
                    Ignore
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

export default NotificationPage;