
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import { AuthContext } from "../context/AuthContext";
import "../styles/NotificationPage.css";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL ||
  "http://localhost:5002";

function NotificationPage() {
  const { user, authLoading } = useContext(AuthContext);

  const userId = user?.id || user?._id;

  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  /* FETCH NOTIFICATIONS */

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load notifications."
        );
      }

      setNotifications(
        Array.isArray(data) ? data : []
      );

      setError("");
    } catch (error) {
      console.error("Notifications error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /* INITIAL LOAD AND PERIODIC REFRESH */

  useEffect(() => {
    if (!userId || authLoading) return;

    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      10000
    );

    return () => clearInterval(interval);
  }, [userId, authLoading, fetchNotifications]);

  /* REAL-TIME NOTIFICATIONS */

  useEffect(() => {
    if (!userId || authLoading) return;

    const token = localStorage.getItem("token");

    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    const handleConnect = () => {
      socket.emit("joinRoom", userId);
      fetchNotifications();
    };

    socket.on("connect", handleConnect);

    socket.on(
      "connectionRequest",
      fetchNotifications
    );

    socket.on(
      "connectionAccepted",
      fetchNotifications
    );

    socket.on(
      "newMatch",
      fetchNotifications
    );

    return () => {
      socket.off("connect", handleConnect);

      socket.off(
        "connectionRequest",
        fetchNotifications
      );

      socket.off(
        "connectionAccepted",
        fetchNotifications
      );

      socket.off(
        "newMatch",
        fetchNotifications
      );

      socket.disconnect();
    };
  }, [userId, authLoading, fetchNotifications]);

  /* ACCEPT OR IGNORE A REQUEST */

  const handleRequest = async (
    notification,
    action
  ) => {
    if (processingId) return;

    setProcessingId(notification._id);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notification._id}/${action}`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to process request."
        );
      }

      setNotifications((previous) =>
        previous.filter(
          (item) => item._id !== notification._id
        )
      );

      if (action === "accept" && data.user) {
        navigate("/messages", {
          state: {
            selectedUser: data.user,
            currentUserId: userId,
          },
        });
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Request error:", error);
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  /* MARK AS READ */

  const handleMarkAsRead = async (notification) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notification._id}/read`,
        {
          method: "PATCH",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to update notification."
        );
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, read: true }
            : item
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  /* PAGE UI */

  return (
    <AppShell className="notification-page">
      <div className="app-page notification-page-inner">

        <h2 className="page-title">
          Notifications
        </h2>

        {error && (
          <p role="alert" style={{ color: "#b45353" }}>
            {error}
          </p>
        )}

        {loading ? (
          <p className="notification-empty-text">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="notification-empty-text">
            No new notifications
          </p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notification ${
                notif.read ? "read" : "unread"
              }`}
            >
              <p>
                {notif.type === "connectionAccepted"
                  ? `You are now connected with ${notif.senderName}.`
                  : notif.message}
              </p>

              {notif.timestamp && (
                <small>
                  {new Date(
                    notif.timestamp
                  ).toLocaleString()}
                </small>
              )}

              {notif.type === "connectionRequest" ? (
                <div className="action-buttons">

                  <button
                    className="connect-button"
                    disabled={Boolean(processingId)}
                    onClick={() =>
                      handleRequest(notif, "accept")
                    }
                  >
                    {processingId === notif._id
                      ? "Processing..."
                      : "Connect"}
                  </button>

                  <button
                    className="ignore-button"
                    disabled={Boolean(processingId)}
                    onClick={() =>
                      handleRequest(notif, "ignore")
                    }
                  >
                    Ignore
                  </button>

                </div>
              ) : !notif.read ? (
                <div className="action-buttons">
                  <button
                    className="ignore-button"
                    onClick={() =>
                      handleMarkAsRead(notif)
                    }
                  >
                    Mark as read
                  </button>
                </div>
              ) : null}

            </div>
          ))
        )}

      </div>
    </AppShell>
  );
}

export default NotificationPage;
