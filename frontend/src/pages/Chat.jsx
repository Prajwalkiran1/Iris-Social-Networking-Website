import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiGet, apiPost } from "../services/apiClient";
import { useNavigate } from "react-router-dom";

const MESSAGE_POLL_MS = 3000;
const CONVERSATIONS_POLL_MS = 10000;

const formatConversations = (data) =>
  (Array.isArray(data) ? data : []).map((conv) => ({
    id: conv.uid,
    user: { uid: conv.uid, name: conv.name },
    lastMessage: conv.lastMessage || "No messages yet",
    timestamp: conv.timestamp || new Date().toISOString(),
  }));

const formatMessages = (data) =>
  (Array.isArray(data) ? data : [])
    .map((msg, i) => ({
      id: msg.id || `srv-${i}`,
      text: msg.text,
      senderId: msg.sender,
      timestamp: msg.timestamp
        ? new Date(msg.timestamp).toISOString()
        : new Date().toISOString(),
    }))
    // Belt-and-suspenders: backend already orders by timestamp, but sort
    // here too so the UI is correct even if any ordering ever regresses.
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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

  // Polling reads selectedChat from a ref so the interval callbacks see the
  // latest selection without restarting the interval each switch.
  const selectedChatRef = useRef(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiGet("/messages/conversations");
      setConversations(formatConversations(data));
    } catch (error) {
      console.error("Failed to load conversations:", error.message);
    }
  }, []);

  const loadMessages = useCallback(async (otherUid) => {
    try {
      const data = await apiGet(`/messages/chat/${otherUid}`);
      // Drop any optimistic local-prefixed messages that the server now
      // has; replace wholesale with the server's authoritative list.
      setMessages(formatMessages(data));
    } catch (error) {
      console.error("Failed to load chat history:", error.message);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    let cancelled = false;
    (async () => {
      await loadConversations();
      try {
        const usersData = await apiGet("/search/users?q=a");
        if (cancelled) return;
        const list = (Array.isArray(usersData) ? usersData : []).filter(
          (u) => u.uid !== currentUser?.uid
        );
        setUsers(list);
        setFilteredUsers(list);
      } catch (error) {
        console.error("Failed to load users:", error.message);
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, navigate, loadConversations]);

  // Poll: refresh open chat every 3s, refresh conversation list every 10s.
  useEffect(() => {
    if (!currentUser) return;
    const msgInterval = setInterval(() => {
      const cur = selectedChatRef.current;
      if (cur) loadMessages(cur.user.uid);
    }, MESSAGE_POLL_MS);
    const convInterval = setInterval(loadConversations, CONVERSATIONS_POLL_MS);
    return () => {
      clearInterval(msgInterval);
      clearInterval(convInterval);
    };
  }, [currentUser, loadConversations, loadMessages]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.interests &&
          user.interests.some((interest) =>
            interest.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const selectChat = async (conversation) => {
    setSelectedChat(conversation);
    setMessages([]);
    await loadMessages(conversation.user.uid);
  };

  const startConversation = async (user) => {
    // If we already have a conversation with this user, just switch to it
    // rather than creating a phantom duplicate keyed by Date.now().
    const existing = conversations.find((c) => c.user.uid === user.uid);
    if (existing) {
      await selectChat(existing);
      return;
    }
    const newChat = {
      id: user.uid,
      user,
      lastMessage: "No messages yet",
      timestamp: new Date().toISOString(),
    };
    setConversations((prev) => [newChat, ...prev]);
    await selectChat(newChat);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const text = newMessage;
    const tempId = `local-${Date.now()}`;
    const optimistic = {
      id: tempId,
      text,
      senderId: currentUser.uid,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    setConversations((prev) =>
      prev.map((c) =>
        c.user.uid === selectedChat.user.uid
          ? { ...c, lastMessage: text, timestamp: optimistic.timestamp }
          : c
      )
    );

    try {
      await apiPost("/messages/send", {
        receiver: selectedChat.user.uid,
        text,
      });
      // Reconcile with the server: replaces the optimistic message with
      // the canonical one (and surfaces any messages the other party sent
      // in between).
      await loadMessages(selectedChat.user.uid);
    } catch (error) {
      console.error("Failed to send message:", error.message);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
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
                onClick={() => selectChat(conversation)}
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
