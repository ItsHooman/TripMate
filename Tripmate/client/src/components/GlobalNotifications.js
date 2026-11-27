
import React, {
  useEffect,
  useContext,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FiMessageCircle,
  FiHeart,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

import "../styles/GlobalNotifications.css";

function GlobalNotifications() {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();

  const location = useLocation();
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);

  const userId = String(
    user?.id || user?._id || ""
  );

  useEffect(() => {
    setToast(null);
  }, [userId, location.pathname]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleMessage = (data) => {
      if (
        String(data?.recipientId) !== userId ||
        location.pathname === "/messages"
      ) {
        return;
      }

      setToast({
        type: "message",
        title: "New message",
        description:
          "You have a new message from a traveler.",
        action: "View conversation",
        path: "/messages",
        state: {
          selectedUser: {
            _id: data.senderId,
          },
        },
      });
    };

    const handleNewMatch = (data) => {
      // MatchingPage already displays a match modal.
      if (location.pathname === "/matching") {
        return;
      }

      const name =
        data?.user?.profile?.name ||
        data?.user?.name ||
        "a traveler";

      setToast({
        type: "match",
        title: "It's a TripMatch!",
        description:
          `You and ${name} liked each other.`,
        action: "Start a conversation",
        path: "/messages",
        state: {
          selectedUser: data?.user,
        },
      });
    };

    const handleConnectionRequest = (data) => {
      if (location.pathname === "/notifications") {
        return;
      }

      const name =
        data?.user?.profile?.name ||
        data?.user?.name ||
        "A traveler";

      setToast({
        type: "request",
        title: "New connection request",
        description:
          `${name} wants to connect with you.`,
        action: "View request",
        path: "/notifications",
      });
    };

    const handleConnectionAccepted = (data) => {
      if (location.pathname === "/messages") {
        return;
      }

      setToast({
        type: "request",
        title: "Connection accepted",
        description:
          `You are now connected with ${
            data?.senderName || "a traveler"
          }.`,
        action: "Send a message",
        path: "/messages",
        state: {
          selectedUser: {
            _id: data?.senderId,
          },
        },
      });
    };

    socket.on("receiveMessage", handleMessage);
    socket.on("newMatch", handleNewMatch);

    socket.on(
      "connectionRequest",
      handleConnectionRequest
    );

    socket.on(
      "connectionAccepted",
      handleConnectionAccepted
    );

    return () => {
      socket.off("receiveMessage", handleMessage);
      socket.off("newMatch", handleNewMatch);

      socket.off(
        "connectionRequest",
        handleConnectionRequest
      );

      socket.off(
        "connectionAccepted",
        handleConnectionAccepted
      );
    };
  }, [socket, userId, location.pathname]);

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => {
      setToast(null);
    }, 6000);

    return () => clearTimeout(timeout);
  }, [toast]);

  if (!toast || !userId) return null;

  const Icon =
    toast.type === "match"
      ? FiHeart
      : toast.type === "request"
      ? FiUserPlus
      : FiMessageCircle;

  const handleOpen = () => {
    navigate(toast.path, {
      state: toast.state,
    });

    setToast(null);
  };

  return (
    <div
      className="tm-global-toast"
      role="status"
    >
      <div
        className={`tm-toast-icon ${toast.type}`}
      >
        <Icon aria-hidden="true" />
      </div>

      <div className="tm-toast-content">
        <strong>{toast.title}</strong>

        <p>{toast.description}</p>

        <button
          type="button"
          className="tm-toast-action"
          onClick={handleOpen}
        >
          {toast.action}
        </button>
      </div>

      <button
        type="button"
        className="tm-toast-close"
        aria-label="Dismiss notification"
        onClick={() => setToast(null)}
      >
        <FiX />
      </button>
    </div>
  );
}

export default GlobalNotifications;
