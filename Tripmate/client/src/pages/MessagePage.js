import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/MessagePage.css';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import API_BASE_URL from "../config/api";

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5002";

function MessagesPage() {
    const location = useLocation();
    const navigate = useNavigate();
    //const { connectedUsers = [], currentUserId } = location.state || {};
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    //const [selectedUser, setSelectedUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null); 
    const [unreadMessages, setUnreadMessages] = useState({});
    const {user, logout} = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    
        // Initialize state with location state or fallback to localStorage
        const [currentUserId, setCurrentUserId] = useState(() => {
            return location.state?.currentUserId || localStorage.getItem("currentUserId") || null;
        });
    
        const [connectedUsers, setConnectedUsers] = useState(() => {
            return location.state?.connectedUsers || JSON.parse(localStorage.getItem('connectedUsers')) || [];
        });
    
        const [selectedUser, setSelectedUser] = useState(null);
    
        console.log("Connected users:", connectedUsers);
        console.log("Selected user:", selectedUser);
        console.log("Current user ID:", currentUserId);
    
        // Persist currentUserId in localStorage
        useEffect(() => {
            if (currentUserId) {
                localStorage.setItem("currentUserId", currentUserId);
            }
        }, [currentUserId]);
    
        useEffect(() => {
            if (connectedUsers.length > 0 && currentUserId) {
                const filteredUsers = connectedUsers.filter(user => user.id !== currentUserId);
                if (JSON.stringify(filteredUsers) !== JSON.stringify(connectedUsers)) {
                    setConnectedUsers(filteredUsers);
                    localStorage.setItem("connectedUsers", JSON.stringify(filteredUsers));
                }
            }
        }, [currentUserId]);
    
        // Check if selected user is connected
        const isUserConnected = selectedUser ? connectedUsers.some(user => user.id === selectedUser.id) : false;
        console.log("Is selected user connected?", isUserConnected);

    
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    
    //const storedUsers = JSON.parse(localStorage.getItem('connectedUsers')) || [];
  
    useEffect(() => {
        const newSocket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        setSocket(newSocket);
    
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, []);  // Empty dependency ensures the effect runs only once when the component mounts
    
  
    useEffect(() => {
        if (socket && currentUserId) {
            socket.emit('joinRoom', currentUserId); // Join own room to receive messages
            console.log(`Joined room: ${currentUserId}`);
        } else {
            console.error('Socket is not initialized or currentUserId is missing');
        }
    }, [currentUserId, socket]);         
    
  
    useEffect(() => {
        if (socket) {
            const handleMessage = (data) => {
                console.log('Received message:', data);
                console.log('Current messages:', messages);
   
                setMessages((prevMessages) => {
                    const messageExists = prevMessages.some(
                        (msg) => msg.timestamp === data.timestamp
                    );
                    if (messageExists) {
                        console.log('Duplicate message ignored:', data);
                        return prevMessages;
                    }
   
                    setUnreadMessages((prevUnreadMessages) => {
                        const newCount = prevUnreadMessages[data.senderId]
                            ? prevUnreadMessages[data.senderId] + 1
                            : 1;
                        return {
                            ...prevUnreadMessages,
                            [data.senderId]: newCount,
                        };
                    });
   
                    return [...prevMessages, data];
                });
            };
   
            socket.on('receiveMessage', handleMessage);
   
            return () => {
                socket.off('receiveMessage', handleMessage);
            };
        }
    }, [socket]);   

    useEffect(() => {
        if (selectedUser && currentUserId) {
            setMessages([]);  
    
            fetch(`${API_BASE_URL}/message/messages?userId=${currentUserId}&recipientId=${selectedUser._id}`)
                .then((res) => res.json())
                .then((data) => {
                    const uniqueMessages = data.filter((msg) =>
                        !messages.some((existingMsg) => existingMsg._id === msg._id)
                    );
                    setMessages(uniqueMessages);
                    if (uniqueMessages.length > 0) {
                        setLastMessageTimestamp(uniqueMessages[uniqueMessages.length - 1].timestamp);
                    }
                    // Reset unread message count for the selected user
                    setUnreadMessages((prevUnreadMessages) => ({
                        ...prevUnreadMessages,
                        [selectedUser._id]: 0,
                    }));
                })
                .catch((err) => {
                    console.error('Error fetching messages:', err);
                    setMessages([]);
                });
    
            socket.emit('joinRoom', selectedUser._id);
        }
    }, [selectedUser, currentUserId, socket]);    

    const handleSelectUser = (user) => {
        console.log("Attempting to select user:", user);
    
        // Check if the selected user is in connectedUsers
        const isUserConnected = connectedUsers.some((connectedUser) => connectedUser._id === user._id);
        console.log("Is user connected?", isUserConnected);
    
        if (isUserConnected) {
            setSelectedUser(user);
            setMessages([]);  // Clear previous messages when a new user is selected
            console.log('Selected user:', user);
        } else {
            // Handle the case when the selected user is not in connectedUsers
            console.log('User is not connected!');
            setSelectedUser(null);  // Optionally set to null or show an alert/message
        }
    };       

    const handleSendMessage = async () => {
        console.log('Sending message:', newMessage);
        console.log('Selected user:', selectedUser);
        console.log('Current user ID:', currentUserId);
    
        if (!newMessage.trim() || !selectedUser || !selectedUser._id) {
            console.error('Invalid message data:', newMessage, selectedUser);
            return;
        }
    
        console.log('Emitting sendMessage event...');
        socket.emit('sendMessage', {
            senderId: currentUserId,
            recipientId: selectedUser._id,
            message: newMessage,
        });
    
        setNewMessage('');
    };    

    const handleDisconnect = (userToDisconnect) => {
        const updatedUsers = connectedUsers.filter((user) => user._id !== userToDisconnect._id);
        localStorage.setItem('connectedUsers', JSON.stringify(updatedUsers));

        if (selectedUser?._id === userToDisconnect._id) {
            setSelectedUser(updatedUsers[0] || null);
            setMessages([]);
        }

        navigate('/messages', {
            state: { connectedUsers: updatedUsers, currentUserId },
        });
    };

    useEffect(() => {
        if (selectedUser && lastMessageTimestamp) {
            fetch(`${API_BASE_URL}/message/messages?userId=${currentUserId}&recipientId=${selectedUser._id}`)
                .then((res) => res.json())
                .then((data) => {
                    const newMessages = data.filter((msg) => new Date(msg.timestamp) > new Date(lastMessageTimestamp));
                    setMessages((prevMessages) => [...prevMessages, ...newMessages]);
                    if (newMessages.length > 0) {
                        setLastMessageTimestamp(newMessages[newMessages.length - 1].timestamp);
                    }
                });
        }
    }, [lastMessageTimestamp, selectedUser, currentUserId]);

    const handleLogout = () => {
        logout(); 
        navigate("/login"); 
    };

    return (
        <div className="messages-page">
                <Navbar />
                <div className="app-page">
           <h2 className="page-title">Messages</h2>

            {/* Connected Users Section */}
            <div className="connected-users">
                <h3>Connected Users:</h3>
                <div className="user-grid">
                {connectedUsers
                .filter((user) => user._id !== currentUserId) 
                .map((user, index) => (
                    <div
                        key={`${user._id}-${index}`}
                        onClick={() => handleSelectUser(user)}
                        className={`user-card ${selectedUser?._id === user._id ? "selected" : ""}`}
                    >
                    {/* Profile Photo */}
                    {user.profile?.profilePicture ? (
                        <img
                            src={user.profile.profilePicture}
                            alt={`${user.profile.name}'s profile`}
                            className="profile-photo"
                        />
                    ) : (
                        <div className="profile-placeholder">N/A</div>
                    )}
                        <p>{user.profile?.name || "Unknown User"}</p>
                        {/* Unread message badge */}
                        {unreadMessages[user._id] > 0 && (
                            <div className="unread-badge">{unreadMessages[user._id]}</div>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnect(user);
                            }}
                            className="disconnect-btn"
                        >
                            Disconnect
                        </button>
                    </div>
                ))}
                </div>
            </div>

            {/* Chat Section */}
            {selectedUser && (
                <div className="chat-section">
                    <h4>Chat with {selectedUser.profile?.name}</h4>
                    <div className="messages-container">
                        <div className="messages">
                            {messages.length > 0 ? (
                                messages.map((msg, index) => {
                                    if (!msg.message || !msg.timestamp) return null;

                                    return (
                                        <div
                                            key={index}
                                            className={`message ${msg.senderId === currentUserId ? "sent" : "received"}`}
                                        >
                                            <p>
                                                <strong>
                                                    {msg.senderId === currentUserId ? "You" : selectedUser.profile?.name}:
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
                        />
                        <button onClick={handleSendMessage} className="send-btn">
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
            </div>
    );
}

export default MessagesPage;