import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import "../styles/MessagePage.css";
import { AuthContext } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

function MessagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});

  const [currentUserId, setCurrentUserId] = useState(() => {
    return (
      location.state?.currentUserId ||
      user?.id ||
      localStorage.getItem("currentUserId") ||
      null
    );
  });

  const [connectedUsers, setConnectedUsers] = useState(() => {
    return (
      location.state?.connectedUsers ||
      JSON.parse(localStorage.getItem("connectedUsers")) ||
      []
    );
  });

  const [selectedUser, setSelectedUser] = useState(() => {
    return location.state?.selectedUser || null;
  });

  useEffect(() => {
    if (user?.id && !currentUserId) {
      setCurrentUserId(user.id);
    }
  }, [user, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem("currentUserId", currentUserId);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (connectedUsers.length > 0 && currentUserId) {
      const filteredUsers = connectedUsers.filter(
        (connectedUser) => connectedUser._id !== currentUserId
      );

      if (JSON.stringify(filteredUsers) !== JSON.stringify(connectedUsers)) {
        setConnectedUsers(filteredUsers);
        localStorage.setItem("connectedUsers", JSON.stringify(filteredUsers));
      }
    }
  }, [connectedUsers, currentUserId]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && currentUserId) {
      socket.emit("joinRoom", currentUserId);
    }
  }, [currentUserId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (msg) =>
            msg.timestamp === data.timestamp &&
            msg.senderId === data.senderId &&
            msg.message === data.message
        );

        if (messageExists) return prevMessages;

        if (selectedUser?._id !== data.senderId) {
          setUnreadMessages((prevUnreadMessages) => ({
            ...prevUnreadMessages,
            [data.senderId]: (prevUnreadMessages[data.senderId] || 0) + 1,
          }));
        }

        return [...prevMessages, data];
      });
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !currentUserId || !socket) return;

    setMessages([]);

    fetch(
      `${API_BASE_URL}/message/messages?userId=${currentUserId}&recipientId=${selectedUser._id}`
    )
      .then((res) => res.json())
      .then((data) => {
        const safeMessages = Array.isArray(data) ? data : [];
        setMessages(safeMessages);

        if (safeMessages.length > 0) {
          setLastMessageTimestamp(
            safeMessages[safeMessages.length - 1].timestamp
          );
        } else {
          setLastMessageTimestamp(null);
        }

        setUnreadMessages((prevUnreadMessages) => ({
          ...prevUnreadMessages,
          [selectedUser._id]: 0,
        }));
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setMessages([]);
      });

    socket.emit("joinRoom", selectedUser._id);
  }, [selectedUser, currentUserId, socket]);

  const handleSelectUser = (selected) => {
    const isUserConnected = connectedUsers.some(
      (connectedUser) => connectedUser._id === selected._id
    );

    if (isUserConnected) {
      setSelectedUser(selected);
      setMessages([]);
    } else {
      setSelectedUser(null);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !selectedUser._id || !socket) {
      return;
    }

    socket.emit("sendMessage", {
      senderId: currentUserId,
      recipientId: selectedUser._id,
      message: newMessage,
    });

    setNewMessage("");
  };

  const handleDisconnect = (userToDisconnect) => {
    const updatedUsers = connectedUsers.filter(
      (connectedUser) => connectedUser._id !== userToDisconnect._id
    );

    setConnectedUsers(updatedUsers);
    localStorage.setItem("connectedUsers", JSON.stringify(updatedUsers));

    if (selectedUser?._id === userToDisconnect._id) {
      setSelectedUser(updatedUsers[0] || null);
      setMessages([]);
    }

    navigate("/messages", {
      state: { connectedUsers: updatedUsers, currentUserId },
    });
  };

  useEffect(() => {
    if (!selectedUser || !lastMessageTimestamp || !currentUserId) return;

    fetch(
      `${API_BASE_URL}/message/messages?userId=${currentUserId}&recipientId=${selectedUser._id}`
    )
      .then((res) => res.json())
      .then((data) => {
        const safeMessages = Array.isArray(data) ? data : [];

        const newMessages = safeMessages.filter(
          (msg) => new Date(msg.timestamp) > new Date(lastMessageTimestamp)
        );

        if (newMessages.length > 0) {
          setMessages((prevMessages) => [...prevMessages, ...newMessages]);
          setLastMessageTimestamp(
            newMessages[newMessages.length - 1].timestamp
          );
        }
      })
      .catch((err) => {
        console.error("Error refreshing messages:", err);
      });
  }, [lastMessageTimestamp, selectedUser, currentUserId]);

  return (
    <AppShell className="messages-page">
      <div className="app-page messages-page-inner">
        <h2 className="page-title">Messages</h2>

        <div className="connected-users">
          <h3>Connected Users:</h3>

          <div className="user-grid">
            {connectedUsers
              .filter((connectedUser) => connectedUser._id !== currentUserId)
              .map((connectedUser, index) => (
                <div
                  key={`${connectedUser._id}-${index}`}
                  onClick={() => handleSelectUser(connectedUser)}
                  className={`user-card ${
                    selectedUser?._id === connectedUser._id ? "selected" : ""
                  }`}
                >
                  {connectedUser.profile?.profilePicture ? (
                    <img
                      src={connectedUser.profile.profilePicture}
                      alt={`${connectedUser.profile?.name || "User"} profile`}
                      className="profile-photo"
                    />
                  ) : (
                    <div className="profile-placeholder">N/A</div>
                  )}

                  <p>{connectedUser.profile?.name || "Unknown User"}</p>

                  {unreadMessages[connectedUser._id] > 0 && (
                    <div className="unread-badge">
                      {unreadMessages[connectedUser._id]}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnect(connectedUser);
                    }}
                    className="disconnect-btn"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
          </div>
        </div>

        {selectedUser && (
          <div className="chat-section">
            <h4>Chat with {selectedUser.profile?.name || "User"}</h4>

            <div className="messages-container">
              <div className="messages">
                {messages.length > 0 ? (
                  messages.map((msg, index) => {
                    if (!msg.message || !msg.timestamp) return null;

                    return (
                      <div
                        key={index}
                        className={`message ${
                          msg.senderId === currentUserId ? "sent" : "received"
                        }`}
                      >
                        <p>
                          <strong>
                            {msg.senderId === currentUserId
                              ? "You"
                              : selectedUser.profile?.name || "User"}
                            :
                          </strong>{" "}
                          {msg.message}
                        </p>

                        <small className="timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </small>
                      </div>
                    );
                  })
                ) : (
                  <p>No messages yet.</p>
                )}
              </div>
            </div>

            <div className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />

              <button onClick={handleSendMessage} className="send-btn">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default MessagesPage;