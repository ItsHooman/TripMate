
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
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
  process.env.REACT_APP_SOCKET_URL ||
  "http://localhost:5002";

/* HELPERS */

const getName = (user) =>
  user?.profile?.name ||
  user?.name ||
  "Traveler";

const getId = (user) =>
  String(user?._id || user?.id || "");

const getImageUrl = (image) => {
  if (!image) return "";

  if (image.startsWith("/uploads/")) {
    return `${API_BASE_URL.replace(/\/api\/?$/, "")}${image}`;
  }

  return image;
};

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Something went wrong."
    );
  }

  return data;
}

/* USER AVATAR */

function UserAvatar({ user }) {
  const [imageFailed, setImageFailed] = useState(false);

  const image = getImageUrl(
    user?.profile?.profilePicture ||
    user?.profilePicture
  );

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

/* PREVENT DUPLICATE MESSAGES */

function mergeMessages(previous, incoming) {
  const unique = new Map();

  [...previous, ...incoming].forEach((message) => {
    const key =
      message._id ||
      JSON.stringify([
        message.senderId,
        message.recipientId,
        message.timestamp,
        message.message,
      ]);

    unique.set(String(key), message);
  });

  return [...unique.values()].sort(
    (a, b) =>
      new Date(a.timestamp) -
      new Date(b.timestamp)
  );
}

/* MAIN PAGE */

function MessagesPage() {
  const location = useLocation();

  const { user, authLoading } =
    useContext(AuthContext);

  const currentUserId = getId(user);

  const [connectedUsers, setConnectedUsers] =
    useState([]);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [unreadMessages, setUnreadMessages] =
    useState({});

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [loadingConnections, setLoadingConnections] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [connectionError, setConnectionError] =
    useState("");

  const [messageError, setMessageError] =
    useState("");

  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] =
    useState(false);

  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);
  const inputRef = useRef(null);
  const connectionsRequestRef = useRef(0);
  const sendingRef = useRef(false);

  const selectedUserId = getId(selectedUser);

  const requestedUserId = getId(
    location.state?.selectedUser
  );

  const connections = connectedUsers.filter(
    (connection) =>
      getId(connection) &&
      getId(connection) !== currentUserId
  );

  const filteredUsers = connections.filter(
    (connection) =>
      getName(connection)
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())
  );

  /* CLEAR ACTIVE CONVERSATION */

  const clearConversation = useCallback(() => {
    selectedUserRef.current = null;

    setSelectedUser(null);
    setMessages([]);
    setNewMessage("");
    setMessageError("");
    setSendError("");
    setMenuOpen(false);
    setMobileChatOpen(false);
  }, []);

  /* SELECT CONVERSATION */

  const handleSelectUser = useCallback((connection) => {
    if (
      getId(connection) !==
      getId(selectedUserRef.current)
    ) {
      setMessages([]);
      setNewMessage("");
      setMessageError("");
      setSendError("");
    }

    selectedUserRef.current = connection;

    setSelectedUser(connection);
    setMobileChatOpen(true);
    setMenuOpen(false);

    setUnreadMessages((previous) => ({
      ...previous,
      [getId(connection)]: 0,
    }));
  }, []);

  /* FETCH PERSISTENT CONNECTIONS */

  const fetchConnections = useCallback(async () => {
    if (!currentUserId) return;

    const requestId =
      ++connectionsRequestRef.current;

    try {
      const data = await apiRequest(
        "/message/connections"
      );

      if (
        requestId !== connectionsRequestRef.current
      ) {
        return;
      }

      const users = Array.isArray(data)
        ? data
        : [];

      setConnectedUsers(users);
      setConnectionError("");

      const activeId = getId(
        selectedUserRef.current
      );

      if (
        activeId &&
        !users.some(
          (connection) =>
            getId(connection) === activeId
        )
      ) {
        clearConversation();
      }
    } catch (error) {
      if (
        requestId === connectionsRequestRef.current
      ) {
        setConnectionError(error.message);
      }
    } finally {
      if (
        requestId === connectionsRequestRef.current
      ) {
        setLoadingConnections(false);
      }
    }
  }, [currentUserId, clearConversation]);

  /* INITIAL LOAD */

  useEffect(() => {
    if (!currentUserId || authLoading) return;

    clearConversation();
    setConnectedUsers([]);
    setUnreadMessages({});
    setLoadingConnections(true);

    fetchConnections();

    return () => {
      connectionsRequestRef.current += 1;
    };
  }, [
    currentUserId,
    authLoading,
    fetchConnections,
    clearConversation,
  ]);

  /* OPEN MATCH FROM NAVIGATION */

  useEffect(() => {
    if (!requestedUserId) return;

    const requestedUser = connectedUsers.find(
      (connection) =>
        getId(connection) === requestedUserId
    );

    if (
      requestedUser &&
      !selectedUserRef.current
    ) {
      handleSelectUser(requestedUser);
    }
  }, [
    requestedUserId,
    connectedUsers,
    handleSelectUser,
  ]);

  /* AUTHENTICATED SOCKET */

  useEffect(() => {
    if (!currentUserId || authLoading) return;

    const token = localStorage.getItem("token");

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError("");
      fetchConnections();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      setIsConnected(false);
      setConnectionError(error.message);
    };

    const handleMessage = (data) => {
      if (!data?.message || !data?.timestamp) {
        return;
      }

      const senderId = String(data.senderId);
      const recipientId = String(data.recipientId);

      const activeId = getId(
        selectedUserRef.current
      );

      const isSentByMe =
        senderId === currentUserId;

      const isReceivedByMe =
        recipientId === currentUserId;

      if (!isSentByMe && !isReceivedByMe) {
        return;
      }

      const belongsToConversation =
        (isSentByMe && recipientId === activeId) ||
        (isReceivedByMe && senderId === activeId);

      if (belongsToConversation) {
        setMessages((previous) =>
          mergeMessages(previous, [data])
        );
      } else if (isReceivedByMe) {
        setUnreadMessages((previous) => ({
          ...previous,
          [senderId]:
            (previous[senderId] || 0) + 1,
        }));
      }
    };

    const handleConnectionRemoved = (data) => {
      const removedId = String(
        data?.userId || ""
      );

      setConnectedUsers((previous) =>
        previous.filter(
          (connection) =>
            getId(connection) !== removedId
        )
      );

      if (
        getId(selectedUserRef.current) === removedId
      ) {
        clearConversation();
      }

      fetchConnections();
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connect_error", handleConnectError);

    newSocket.on(
      "receiveMessage",
      handleMessage
    );

    newSocket.on(
      "newMatch",
      fetchConnections
    );

    newSocket.on(
      "connectionAccepted",
      fetchConnections
    );

    newSocket.on(
      "connectionRemoved",
      handleConnectionRemoved
    );

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [
    currentUserId,
    authLoading,
    fetchConnections,
    clearConversation,
  ]);

  /* FETCH MESSAGE HISTORY */

  useEffect(() => {
    if (!selectedUserId || !currentUserId) {
      return;
    }

    const controller = new AbortController();

    setLoadingMessages(true);
    setMessageError("");

    const fetchMessages = async () => {
      try {
        const data = await apiRequest(
          `/message/messages?recipientId=${encodeURIComponent(
            selectedUserId
          )}`,
          {
            signal: controller.signal,
          }
        );

        if (
          controller.signal.aborted ||
          getId(selectedUserRef.current) !== selectedUserId
        ) {
          return;
        }

        const history = Array.isArray(data)
          ? data
          : [];

        setMessages((previous) =>
          mergeMessages(history, previous)
        );

        setUnreadMessages((previous) => ({
          ...previous,
          [selectedUserId]: 0,
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
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
  }, [
    selectedUserId,
    currentUserId,
    isConnected,
  ]);

  /* SCROLL TO LATEST MESSAGE */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, [
    messages,
    loadingMessages,
    mobileChatOpen,
  ]);

  /* SEND MESSAGE WITH ACKNOWLEDGEMENT */

  const handleSendMessage = (event) => {
    event.preventDefault();

    const text = newMessage.trim();
    const recipientId = selectedUserId;

    if (
      !text ||
      !recipientId ||
      !socket?.connected ||
      sendingRef.current
    ) {
      return;
    }

    sendingRef.current = true;

    setSending(true);
    setSendError("");

    socket.timeout(10000).emit(
      "sendMessage",
      {
        recipientId,
        message: text,
      },
      (error, response) => {
        sendingRef.current = false;
        setSending(false);

        if (
          getId(selectedUserRef.current) !== recipientId
        ) {
          return;
        }

        if (error) {
          setSendError(
            "Delivery could not be confirmed. Check your conversation before retrying."
          );
          return;
        }

        if (!response?.success) {
          setSendError(
            response?.message ||
            "Unable to send message."
          );
          return;
        }

        if (response.message?._id) {
          setMessages((previous) =>
            mergeMessages(previous, [
              response.message,
            ])
          );
        }

        setNewMessage((previous) =>
          previous.trim() === text
            ? ""
            : previous
        );

        inputRef.current?.focus();
      }
    );
  };

  /* PERSISTENT DISCONNECTION */

  const handleDisconnectUser = async () => {
    if (!selectedUser || disconnecting) return;

    const recipientId = selectedUserId;

    const confirmed = window.confirm(
      `Disconnect from ${getName(selectedUser)}?`
    );

    if (!confirmed) return;

    setDisconnecting(true);
    setSendError("");

    try {
      await apiRequest(
        `/message/connections/${recipientId}`,
        {
          method: "DELETE",
        }
      );

      setConnectedUsers((previous) =>
        previous.filter(
          (connection) =>
            getId(connection) !== recipientId
        )
      );

      if (
        getId(selectedUserRef.current) === recipientId
      ) {
        clearConversation();
      }

      await fetchConnections();
    } catch (error) {
      setSendError(error.message);
    } finally {
      setDisconnecting(false);
    }
  };

  /* DATE FORMATTING */

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (
      date.toDateString() === today.toDateString()
    ) {
      return "Today";
    }

    if (
      date.toDateString() === yesterday.toDateString()
    ) {
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

  /* PAGE UI */

  return (
    <AppShell className="messages-shell">
      <div className="mp-page">

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
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
              />
            </div>

            <div className="mp-conversation-list">

              {connectionError && (
                <div className="mp-chat-status">
                  <p>{connectionError}</p>

                  <button
                    type="button"
                    onClick={fetchConnections}
                  >
                    Retry
                  </button>
                </div>
              )}

              {loadingConnections ? (
                <div className="mp-chat-status">
                  Loading connections...
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((connection) => {
                  const connectionId =
                    getId(connection);

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
                        <strong>
                          {getName(connection)}
                        </strong>

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
                    <Link to="/matching">
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

          {/* CHAT AREA */}

          <section className="mp-chat">

            {selectedUser ? (
              <>

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
                        setMenuOpen(
                          (previous) => !previous
                        )
                      }
                    >
                      <FaEllipsisH />
                    </button>

                    {menuOpen && (
                      <div className="mp-dropdown">

                        <button
                          type="button"
                          disabled={disconnecting}
                          onClick={handleDisconnectUser}
                        >
                          <FaUserMinus />

                          {disconnecting
                            ? "Disconnecting..."
                            : "Disconnect"}
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
                        Every great adventure starts
                        with a conversation.
                      </p>

                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const sent =
                        String(msg.senderId) ===
                        currentUserId;

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
                          key={
                            msg._id ||
                            `${msg.senderId}-${msg.timestamp}-${index}`
                          }
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

                {/* CONNECTION STATUS */}

                {!isConnected && (
                  <div className="mp-connection-status">
                    Connecting to messaging server...
                  </div>
                )}

                {sendError && (
                  <div
                    className="mp-connection-status"
                    role="alert"
                  >
                    {sendError}
                  </div>
                )}

                {/* MESSAGE COMPOSER */}

                <form
                  className="mp-composer"
                  onSubmit={handleSendMessage}
                >

                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    maxLength={4000}
                    aria-label="Message"
                    placeholder="Type a message..."
                    onChange={(event) =>
                      setNewMessage(event.target.value)
                    }
                  />

                  <button
                    type="submit"
                    className="mp-send-button"
                    aria-label="Send message"
                    disabled={
                      !newMessage.trim() ||
                      !isConnected ||
                      sending ||
                      disconnecting
                    }
                  >
                    <FaPaperPlane />
                  </button>

                </form>

              </>
            ) : (

              <div className="mp-no-conversation">

                <div className="mp-empty-icon">
                  <FaRegCommentDots />
                </div>

                <h2>
                  Your next adventure starts here.
                </h2>

                <p>
                  Select a conversation to start chatting
                  with your travel companions.
                </p>

                {!loadingConnections &&
                  connections.length === 0 && (
                    <Link
                      to="/matching"
                      className="mp-discover-link"
                    >
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
