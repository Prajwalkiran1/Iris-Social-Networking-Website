import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadChatData();
    } else {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.interests && user.interests.some(interest => 
        interest.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadChatData = async () => {
    try {
      // Load all conversations for the current user
      const conversationsResponse = await fetch(`/api/messages/conversations/${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        console.log("Conversations loaded:", conversationsData);
        
        // Format conversations for the UI
        const formattedConversations = conversationsData.map(conv => ({
          id: conv.uid,
          user: { uid: conv.uid, name: conv.name },
          lastMessage: conv.lastMessage || "No messages yet",
          timestamp: conv.timestamp
        }));
        
        setConversations(formattedConversations);
      } else {
        console.error("Failed to load conversations:", conversationsResponse.status);
        setConversations([]);
      }

      // Load users for starting new conversations
      const usersResponse = await fetch("/api/search/users?q=a", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const filteredUsers = usersData.filter(user => user.uid !== currentUser?.uid);
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
        console.log("Users loaded for chat:", filteredUsers);
      } else {
        console.error("Failed to load users:", usersResponse.status);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error("Failed to load chat data:", error);
      setConversations([]);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (user) => {
    console.log("Starting conversation with user:", user);
    
    // Create conversation locally first
    const newChat = {
      id: Date.now().toString(),
      user,
      lastMessage: "Start a conversation...",
      timestamp: new Date().toISOString()
    };
    setConversations(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    setMessages([]);
    
    // Try to load existing chat history from backend
    try {
      const response = await fetch(`/api/messages/chat/${user.uid}?me=${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const chatHistory = await response.json();
        console.log("Loaded chat history:", chatHistory);
        if (chatHistory.length > 0) {
          // Format messages from backend to match frontend structure
          const formattedMessages = chatHistory.map((msg, index) => ({
            id: msg.id || `backend-${index}-${Date.now()}`,
            text: msg.text,
            senderId: msg.sender,
            timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString()
          }));
          setMessages(formattedMessages);
          // Update last message in conversation
          const lastMsg = formattedMessages[formattedMessages.length - 1];
          setConversations(prev => 
            prev.map(conv => 
              conv.id === newChat.id 
                ? { ...conv, lastMessage: lastMsg.text, timestamp: lastMsg.timestamp }
                : conv
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: Date.now().toString(),
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: new Date().toISOString()
    };

    // Add message to local state immediately
    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Update conversation's last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedChat.id 
          ? { ...conv, lastMessage: newMessage, timestamp: message.timestamp }
          : conv
      )
    );

    // Send message to backend
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: currentUser.uid,
          receiver: selectedChat.user.uid,
          text: newMessage
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Message sent successfully:", result);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading conversations...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.chatLayout}>
        {/* Conversations List */}
        <div style={styles.conversationsList}>
          <div style={styles.listHeader}>
            <h2>Messages</h2>
          </div>
          
          <div style={styles.conversations}>
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                style={{
                  ...styles.conversationItem,
                  backgroundColor: selectedChat?.id === conversation.id ? "#2a2a2a" : "transparent"
                }}
                onClick={() => setSelectedChat(conversation)}
              >
                <div style={styles.conversationInfo}>
                  <div style={styles.conversationName}>{conversation.user.name}</div>
                  <div style={styles.lastMessage}>{conversation.lastMessage}</div>
                </div>
                <div style={styles.timestamp}>
                  {new Date(conversation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.newChatSection}>
            <h3 style={styles.sectionTitle}>Start New Chat</h3>
            <input
              type="text"
              placeholder="Search users by name or interests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.usersList}>
              {filteredUsers.slice(0, 10).map(user => (
                <div
                  key={user.uid}
                  style={styles.userItem}
                >
                  <div style={styles.userInfo}>
                    <div style={styles.userName}>{user.name}</div>
                    {user.interests && user.interests.length > 0 && (
                      <div style={styles.userInterests}>
                        {user.interests.slice(0, 2).map((interest, i) => (
                          <span key={i} style={styles.interestTag}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button style={styles.startChatButton} onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Start chat button clicked for:", user);
                    startConversation(user);
                  }}>
                    Chat
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && searchTerm && (
                <div style={styles.noUsersFound}>
                  No users found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {selectedChat ? (
            <>
              <div style={styles.chatHeader}>
                <div style={styles.chatUserInfo}>
                  <h3>{selectedChat.user.name}</h3>
                  <p style={styles.chatStatus}>Online</p>
                </div>
              </div>

              <div style={styles.messagesContainer}>
                {messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      ...styles.message,
                      alignSelf: message.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
                      backgroundColor: message.senderId === currentUser.uid ? '#3b82f6' : '#2a2a2a'
                    }}
                  >
                    <div style={styles.messageText}>{message.text}</div>
                    <div style={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.messageInput}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  style={styles.input}
                />
                <button onClick={sendMessage} style={styles.sendButton}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyChat}>
              <h3>Select a conversation to start messaging</h3>
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginLeft: "70px",
    height: "100vh",
    backgroundColor: "#0a0a0a",
    color: "#fff"
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    fontSize: "18px",
    color: "#aaa"
  },
  chatLayout: {
    display: "flex",
    height: "100%"
  },
  conversationsList: {
    width: "350px",
    borderRight: "1px solid #333",
    display: "flex",
    flexDirection: "column"
  },
  listHeader: {
    padding: "20px",
    borderBottom: "1px solid #333"
  },
  conversations: {
    flex: 1,
    overflowY: "auto"
  },
  conversationItem: {
    padding: "15px 20px",
    borderBottom: "1px solid #333",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "background-color 0.2s"
  },
  conversationInfo: {
    flex: 1
  },
  conversationName: {
    fontWeight: "500",
    marginBottom: "5px"
  },
  lastMessage: {
    fontSize: "14px",
    color: "#aaa",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  timestamp: {
    fontSize: "12px",
    color: "#666"
  },
  newChatSection: {
    padding: "20px",
    borderTop: "1px solid #333"
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "10px",
    color: "#aaa"
  },
  usersList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  userItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  userName: {
    fontSize: "14px"
  },
  userInfo: {
    flex: 1,
    marginRight: "10px"
  },
  userInterests: {
    display: "flex",
    gap: "4px",
    marginTop: "4px"
  },
  interestTag: {
    padding: "2px 6px",
    backgroundColor: "#333",
    borderRadius: "10px",
    fontSize: "10px",
    color: "#aaa"
  },
  searchInput: {
    width: "100%",
    padding: "10px",
    border: "1px solid #333",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: "14px",
    marginBottom: "10px"
  },
  noUsersFound: {
    padding: "20px",
    textAlign: "center",
    color: "#666",
    fontSize: "14px"
  },
  startChatButton: {
    padding: "4px 8px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer"
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  chatHeader: {
    padding: "20px",
    borderBottom: "1px solid #333"
  },
  chatUserInfo: {
    display: "flex",
    flexDirection: "column"
  },
  chatStatus: {
    fontSize: "14px",
    color: "#22c55e",
    marginTop: "5px"
  },
  messagesContainer: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  message: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column"
  },
  messageText: {
    marginBottom: "5px"
  },
  messageTime: {
    fontSize: "12px",
    opacity: 0.7
  },
  messageInput: {
    padding: "20px",
    borderTop: "1px solid #333",
    display: "flex",
    gap: "10px"
  },
  input: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#2a2a2a",
    border: "1px solid #333",
    borderRadius: "24px",
    color: "#fff",
    fontSize: "16px"
  },
  sendButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    cursor: "pointer",
    fontWeight: "500"
  },
  emptyChat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#666"
  }
};

export default Chat;
