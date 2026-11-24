
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";

import { useLocation, Link } from "react-router-dom";
import { io } from "socket.io-client";

import {
  FaSearch,
  FaPaperPlane,
  FaRegCommentDots,
  FaArrowLeft,
  FaEllipsisH,
  FaUserMinus,
  FaUsers,
} from "react-icons/fa";

import "../styles/MessagePage.css";
import { AuthContext } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

const getName = (user) =>
  user?.profile?.name || user?.name || "Unknown User";

const getId = (user) =>
  String(user?._id || user?.id || "");

function UserAvatar({ user }) {
  const [imageFailed, setImageFailed] = useState(false);

  const image =
    user?.profile?.profilePicture || user?.profilePicture;

  const initials = getName(user)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <div className="mp-avatar">
      {image && !imageFailed ? (
        <img
          src={image}
          alt={getName(user)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

function mergeMessages(previous, incoming) {
  const unique = new Map();

  [...previous, ...incoming].forEach((msg) => {
    const key = JSON.stringify([
      msg.senderId,
      msg.recipientId,
      msg.timestamp,
      msg.message,
    ]);

    unique.set(key, msg);
  });

  return [...unique.values()].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
}

function MessagesPage() {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const currentUserId = String(
    user?.id ||
      user?._id ||
      location.state?.currentUserId ||
      localStorage.getItem("currentUserId") ||
      ""
  );

  const [connectedUsers, setConnectedUsers] = useState(() => {
    try {
      const users =
        location.state?.connectedUsers ||
        JSON.parse(localStorage.getItem("connectedUsers")) ||
        [];

      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  });

  const [selectedUser, setSelectedUser] = useState(
    location.state?.selectedUser || null
  );

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState({});
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [mobileChatOpen, setMobileChatOpen] = useState(
    Boolean(location.state?.selectedUser)
  );

  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(selectedUser);
  const inputRef = useRef(null);

  const selectedUserId = getId(selectedUser);

  const connections = connectedUsers.filter(
    (connection) =>
      getId(connection) &&
      getId(connection) !== currentUserId
  );

  const filteredUsers = connections.filter((connection) =>
    getName(connection)
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
  );

  // Store connections locally.

  useEffect(() => {
    localStorage.setItem(
      "connectedUsers",
      JSON.stringify(connectedUsers)
    );
  }, [connectedUsers]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem("currentUserId", currentUserId);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (Array.isArray(location.state?.connectedUsers)) {
      setConnectedUsers(location.state.connectedUsers);
    }

    if (location.state?.selectedUser) {
      selectedUserRef.current = location.state.selectedUser;
      setSelectedUser(location.state.selectedUser);
      setMobileChatOpen(true);
    }
  }, [location.state]);

  // Establish the Socket.IO connection.

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });

    const handleConnect = () => {
      setIsConnected(true);

      if (currentUserId) {
        newSocket.emit("joinRoom", currentUserId);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);

    setSocket(newSocket);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.disconnect();
    };
  }, [currentUserId]);

  // Receive real-time messages.

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleMessage = (data) => {
      if (!data?.message || !data?.timestamp) return;

      const senderId = String(data.senderId || "");
      const recipientId = String(data.recipientId || "");

      const activeUserId = getId(selectedUserRef.current);

      const isSentByMe = senderId === currentUserId;
      const isReceivedByMe = recipientId === currentUserId;

      if (!isSentByMe && !isReceivedByMe) return;

      const belongsToConversation =
        (isSentByMe && recipientId === activeUserId) ||
        (isReceivedByMe && senderId === activeUserId);

      if (belongsToConversation) {
        setMessages((previous) =>
          mergeMessages(previous, [data])
        );
      } else if (isReceivedByMe && !isSentByMe) {
        setUnreadMessages((previous) => ({
          ...previous,
          [senderId]: (previous[senderId] || 0) + 1,
        }));
      }
    };

    socket.on("receiveMessage", handleMessage);

    return () => {
      socket.off("receiveMessage", handleMessage);
    };
  }, [socket, currentUserId]);

  // Fetch conversation history.

  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;

    const controller = new AbortController();

    setLoadingMessages(true);
    setMessageError("");

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/message/messages?userId=${encodeURIComponent(
            currentUserId
          )}&recipientId=${encodeURIComponent(selectedUserId)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load messages.");
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        const history = Array.isArray(data) ? data : [];

        setMessages((previous) =>
          mergeMessages(history, previous)
        );

        setUnreadMessages((previous) => ({
          ...previous,
          [selectedUserId]: 0,
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          setMessageError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMessages(false);
        }
      }
    };

    fetchMessages();

    return () => controller.abort();
  }, [selectedUserId, currentUserId]);

  // Scroll to the latest message.

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "instant",
      block: "end",
    });
  }, [messages, loadingMessages, mobileChatOpen]);

  const handleSelectUser = (connection) => {
    if (getId(connection) !== selectedUserId) {
      setMessages([]);
      setNewMessage("");
      setMessageError("");
    }

    selectedUserRef.current = connection;
    setSelectedUser(connection);
    setMobileChatOpen(true);
    setMenuOpen(false);

    setUnreadMessages((previous) => ({
      ...previous,
      [getId(connection)]: 0,
    }));
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    const text = newMessage.trim();

    if (
      !text ||
      !selectedUserId ||
      !currentUserId ||
      !socket?.connected
    ) {
      return;
    }

    socket.emit("sendMessage", {
      senderId: currentUserId,
      recipientId: selectedUserId,
      message: text,
    });

    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleDisconnectUser = () => {
    if (!selectedUser) return;

    const confirmed = window.confirm(
      `Disconnect from ${getName(selectedUser)}?`
    );

    if (!confirmed) return;

    setConnectedUsers((previous) =>
      previous.filter(
        (connection) => getId(connection) !== selectedUserId
      )
    );

    selectedUserRef.current = null;
    setSelectedUser(null);
    setMessages([]);
    setNewMessage("");
    setMenuOpen(false);
    setMobileChatOpen(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year:
        date.getFullYear() !== today.getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  return (
    <AppShell className="messages-shell">
      <div className="mp-page">

        {/* PAGE HEADER */}

        <header className="mp-page-heading">
          <span className="mp-eyebrow">
            BETTER TOGETHER
          </span>

          <h1>Messages</h1>

          <p>
            Stay connected with your travel companions.
          </p>
        </header>

        <div
          className={`mp-layout ${
            mobileChatOpen ? "mp-chat-open" : ""
          }`}
        >

          {/* CONVERSATION SIDEBAR */}

          <aside className="mp-sidebar">

            <div className="mp-sidebar-header">
              <h2>Conversations</h2>

              <span className="mp-connection-count">
                {connections.length}
              </span>
            </div>

            <div className="mp-search">
              <FaSearch />

              <input
                type="search"
                placeholder="Search people..."
                aria-label="Search conversations"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
              />
            </div>

            <div className="mp-conversation-list">

              {filteredUsers.length > 0 ? (
                filteredUsers.map((connection) => {
                  const connectionId = getId(connection);

                  const unread =
                    unreadMessages[connectionId] || 0;

                  return (
                    <button
                      type="button"
                      key={connectionId}
                      className={`mp-conversation ${
                        selectedUserId === connectionId
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectUser(connection)
                      }
                    >
                      <UserAvatar user={connection} />

                      <div className="mp-conversation-info">
                        <strong>{getName(connection)}</strong>

                        <span>
                          {unread > 0
                            ? "New message"
                            : "Connected"}
                        </span>
                      </div>

                      {unread > 0 && (
                        <span className="mp-unread">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="mp-sidebar-empty">
                  <FaUsers />

                  <p>
                    {searchQuery
                      ? "No matching connections"
                      : "No connections yet"}
                  </p>

                  {!searchQuery && (
                    <Link to="/">
                      Find travel companions
                    </Link>
                  )}
                </div>
              )}

            </div>

            <div className="mp-sidebar-footer">
              <FaUsers />

              <span>
                {connections.length}{" "}
                {connections.length === 1
                  ? "connection"
                  : "connections"}
              </span>
            </div>

          </aside>

          {/* CONVERSATION AREA */}

          <section className="mp-chat">

            {selectedUser ? (
              <>

                {/* CHAT HEADER */}

                <header className="mp-chat-header">

                  <button
                    type="button"
                    className="mp-mobile-back"
                    aria-label="Back to conversations"
                    onClick={() => {
                      setMobileChatOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <FaArrowLeft />
                  </button>

                  <UserAvatar user={selectedUser} />

                  <div className="mp-chat-user">
                    <h3>{getName(selectedUser)}</h3>
                    <span>Travel companion</span>
                  </div>

                  <div className="mp-menu-wrapper">

                    <button
                      type="button"
                      className="mp-menu-button"
                      aria-label="Conversation options"
                      aria-expanded={menuOpen}
                      onClick={() =>
                        setMenuOpen((previous) => !previous)
                      }
                    >
                      <FaEllipsisH />
                    </button>

                    {menuOpen && (
                      <div className="mp-dropdown">
                        <button
                          type="button"
                          onClick={handleDisconnectUser}
                        >
                          <FaUserMinus />
                          Disconnect
                        </button>
                      </div>
                    )}

                  </div>

                </header>

                {/* MESSAGE HISTORY */}

                <div
                  className="mp-message-history"
                  role="log"
                  aria-label="Conversation messages"
                >

                  {loadingMessages ? (
                    <div className="mp-chat-status">
                      Loading conversation...
                    </div>
                  ) : messageError ? (
                    <div className="mp-chat-status">
                      {messageError}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="mp-chat-empty">

                      <UserAvatar user={selectedUser} />

                      <h3>
                        Say hello to {getName(selectedUser)}!
                      </h3>

                      <p>
                        Every great adventure starts with a
                        conversation.
                      </p>

                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const sent =
                        String(msg.senderId) === currentUserId;

                      const previousMessage =
                        messages[index - 1];

                      const showDate =
                        !previousMessage ||
                        new Date(
                          previousMessage.timestamp
                        ).toDateString() !==
                          new Date(
                            msg.timestamp
                          ).toDateString();

                      return (
                        <React.Fragment
                          key={`${msg.senderId}-${msg.timestamp}-${index}`}
                        >

                          {showDate && (
                            <div className="mp-date-divider">
                              <span>
                                {formatDate(msg.timestamp)}
                              </span>
                            </div>
                          )}

                          <div
                            className={`mp-message-row ${
                              sent ? "sent" : "received"
                            }`}
                          >
                            <div className="mp-message-bubble">

                              <p>{msg.message}</p>

                              <small>
                                {formatTime(msg.timestamp)}
                              </small>

                            </div>
                          </div>

                        </React.Fragment>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />

                </div>

                {/* MESSAGE COMPOSER */}

                {!isConnected && (
                  <div className="mp-connection-status">
                    Connecting to messaging server...
                  </div>
                )}

                <form
                  className="mp-composer"
                  onSubmit={handleSendMessage}
                >

                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    aria-label="Message"
                    placeholder="Type a message..."
                    onChange={(e) =>
                      setNewMessage(e.target.value)
                    }
                  />

                  <button
                    type="submit"
                    className="mp-send-button"
                    aria-label="Send message"
                    disabled={
                      !newMessage.trim() || !isConnected
                    }
                  >
                    <FaPaperPlane />
                  </button>

                </form>

              </>
            ) : (

              /* NO CONVERSATION SELECTED */

              <div className="mp-no-conversation">

                <div className="mp-empty-icon">
                  <FaRegCommentDots />
                </div>

                <h2>Your next adventure starts here.</h2>

                <p>
                  Select a conversation to start chatting
                  with your travel companions.
                </p>

                {connections.length === 0 && (
                  <Link to="/" className="mp-discover-link">
                    Discover travelers
                  </Link>
                )}

              </div>

            )}

          </section>

        </div>

      </div>
    </AppShell>
  );
}

export default MessagesPage;
