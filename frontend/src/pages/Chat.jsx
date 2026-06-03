import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FiSearch as SearchIcon,
  FiSend as Send,
  FiMessageCircle as MessageCircle,
  FiPlus as Plus,
} from "react-icons/fi";
import EmptyState from "../components/EmptyState";
import Avatar from "../components/Avatar";
import { useAuth } from "../contexts/AuthContext";
import { apiGet, apiPost } from "../services/apiClient";
import { useNavigate } from "react-router-dom";
import {
  colors,
  spacing,
  radius,
  type,
  font,
  gradients,
  transition,
  glassCard,
  tag,
} from "../theme";

const MESSAGE_POLL_MS = 3000;
const CONVERSATIONS_POLL_MS = 10000;

const formatConversations = (data) =>
  (Array.isArray(data) ? data : []).map((conv) => ({
    id: conv.uid,
    user: { uid: conv.uid, name: conv.name, photoURL: conv.photoURL || null },
    lastMessage: conv.lastMessage || "No messages yet",
    timestamp: conv.timestamp || new Date().toISOString(),
    unreadCount: Number(conv.unreadCount) || 0,
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

  // Auto-scroll the messages container to the bottom on new messages.
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

  const markConversationRead = useCallback(async (otherUid) => {
    try {
      await apiPost(`/messages/read/${otherUid}`);
    } catch (error) {
      // Non-fatal — UI keeps working, just the badge won't clear on the
      // server side. Don't surface to the user.
      console.error("Failed to mark conversation as read:", error.message);
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
  // Also mark-as-read alongside the message poll so the unread badge stays
  // at zero while the user has the chat actively open.
  useEffect(() => {
    if (!currentUser) return;
    const msgInterval = setInterval(() => {
      const cur = selectedChatRef.current;
      if (cur) {
        loadMessages(cur.user.uid);
        markConversationRead(cur.user.uid);
      }
    }, MESSAGE_POLL_MS);
    const convInterval = setInterval(loadConversations, CONVERSATIONS_POLL_MS);
    return () => {
      clearInterval(msgInterval);
      clearInterval(convInterval);
    };
  }, [currentUser, loadConversations, loadMessages, markConversationRead]);

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
    await markConversationRead(conversation.user.uid);
    // Optimistically clear local unread badge so the user sees feedback now.
    setConversations((prev) =>
      prev.map((c) =>
        c.user.uid === conversation.user.uid ? { ...c, unreadCount: 0 } : c
      )
    );
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
      // Sending implies "I've seen everything up to now" — sync the read
      // marker so the conversations badge stays at zero for me.
      markConversationRead(selectedChat.user.uid);
    } catch (error) {
      console.error("Failed to send message:", error.message);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  if (loading) {
    return (
      <div data-page-shell style={styles.shell}>
        <div style={styles.placeholder}>Loading conversations…</div>
      </div>
    );
  }

  return (
    <div data-page-shell style={styles.shell}>
      <div style={styles.layout}>
        {/* ---------- Left: Conversations + new chat ---------- */}
        <aside style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <h2 style={{ ...type.title2, color: colors.text }}>Messages</h2>
          </div>

          {/* Search bar */}
          <div style={styles.searchField}>
            <SearchIcon
              size={16}
              color={colors.textFaint}
              style={styles.searchIcon}
            />
            <input
              type="text"
              placeholder="Search people…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Existing conversations */}
          <div style={styles.scrollable}>
            {conversations.length > 0 && (
              <div style={styles.sectionLabel}>Conversations</div>
            )}
            {conversations.map((conversation) => {
              const isActive = selectedChat?.id === conversation.id;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectChat(conversation)}
                  style={{
                    ...styles.conversationItem,
                    background: isActive
                      ? colors.glassBgStrong
                      : "transparent",
                    borderColor: isActive
                      ? colors.glassBorder
                      : "transparent",
                  }}
                >
                  <Avatar user={conversation.user} size={40} />
                  <div style={styles.conversationText}>
                    <div style={styles.conversationName}>
                      {conversation.user.name}
                    </div>
                    <div
                      style={{
                        ...styles.lastMessage,
                        color:
                          conversation.unreadCount > 0
                            ? colors.text
                            : colors.textFaint,
                        fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                      }}
                    >
                      {conversation.lastMessage}
                    </div>
                  </div>
                  <div style={styles.conversationMeta}>
                    <div style={styles.timestamp}>
                      {new Date(conversation.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span style={styles.unreadBadge}>
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Start-a-new-chat user list */}
            <div style={styles.sectionLabel}>Start new chat</div>
            {filteredUsers.slice(0, 12).map((user) => (
              <div key={user.uid} style={styles.userItem}>
                <Avatar user={user} size={40} />
                <div style={styles.userTextWrap}>
                  <div style={styles.userName}>{user.name}</div>
                  {user.interests && user.interests.length > 0 && (
                    <div style={styles.userTags}>
                      {user.interests.slice(0, 2).map((interest, i) => (
                        <span key={i} style={tag({ tone: "neutral" })}>
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startConversation(user);
                  }}
                  style={styles.startChatButton}
                  aria-label={`Start chat with ${user.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && searchTerm && (
              <div style={styles.noUsersFound}>
                No users found matching "{searchTerm}"
              </div>
            )}
          </div>
        </aside>

        {/* ---------- Right: Active chat ---------- */}
        <main style={styles.chatPanel}>
          {selectedChat ? (
            <>
              <header style={styles.chatHeader}>
                <Avatar user={selectedChat.user} size={40} />
                <div>
                  <div style={{ ...type.headline, color: colors.text }}>
                    {selectedChat.user.name}
                  </div>
                </div>
              </header>

              <div style={styles.messagesContainer}>
                {messages.map((message) => {
                  const own = message.senderId === currentUser.uid;
                  return (
                    <div
                      key={message.id}
                      style={{
                        ...styles.messageRow,
                        justifyContent: own ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          ...styles.bubble,
                          background: own
                            ? gradients.brand
                            : colors.glassBgStrong,
                          color: colors.text,
                          borderBottomRightRadius: own ? "6px" : radius.lg,
                          borderBottomLeftRadius: own ? radius.lg : "6px",
                          border: own
                            ? "1px solid rgba(255,255,255,0.10)"
                            : `1px solid ${colors.glassBorder}`,
                          backdropFilter: own ? "none" : "blur(18px) saturate(160%)",
                          WebkitBackdropFilter: own
                            ? "none"
                            : "blur(18px) saturate(160%)",
                        }}
                      >
                        <div style={styles.messageText}>{message.text}</div>
                        <div
                          style={{
                            ...styles.messageTime,
                            color: own
                              ? "rgba(255,255,255,0.75)"
                              : colors.textFaint,
                          }}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={styles.messageInputWrap}>
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  style={styles.messageInput}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    ...styles.sendButton,
                    opacity: !newMessage.trim() ? 0.6 : 1,
                    cursor: !newMessage.trim() ? "not-allowed" : "pointer",
                  }}
                  aria-label="Send message"
                >
                  <Send size={17} />
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyChatWrap}>
              <EmptyState
                icon={<MessageCircle size={22} />}
                title="Select a conversation"
                body="Choose from your existing conversations, or start a new one."
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const styles = {
  shell: {
    marginLeft: "70px",
    height: "100vh",
    minHeight: "100vh",
    padding: spacing.lg,
    boxSizing: "border-box",
  },
  placeholder: {
    ...type.body,
    color: colors.textFaint,
    textAlign: "center",
    padding: spacing["2xl"],
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "340px minmax(0, 1fr)",
    gap: spacing.lg,
    height: "100%",
  },

  // --- Left panel ---
  leftPanel: {
    ...glassCard({ padded: false }),
    padding: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  leftHeader: {
    padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
  },
  searchField: {
    position: "relative",
    margin: `0 ${spacing.lg} ${spacing.md}`,
  },
  searchIcon: {
    position: "absolute",
    left: spacing.md,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} 38px`,
    background: colors.input,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: "13px",
    fontFamily: font.family,
    outline: "none",
    boxSizing: "border-box",
    transition: transition(["border-color"]),
  },
  scrollable: {
    flex: 1,
    overflowY: "auto",
    padding: `0 ${spacing.sm} ${spacing.md}`,
  },
  sectionLabel: {
    ...type.caption,
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: `${spacing.md} ${spacing.sm} ${spacing.xs}`,
  },
  conversationItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    padding: `${spacing.sm} ${spacing.md}`,
    width: "100%",
    border: "1px solid transparent",
    borderRadius: radius.md,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: transition(["background", "border-color"]),
    marginBottom: "2px",
  },
  conversationText: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  conversationName: {
    ...type.callout,
    color: colors.text,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  lastMessage: {
    ...type.footnote,
    color: colors.textFaint,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: "2px",
  },
  timestamp: {
    ...type.caption,
    color: colors.textFaint,
    flexShrink: 0,
  },
  conversationMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
    flexShrink: 0,
  },
  unreadBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "18px",
    height: "18px",
    padding: "0 6px",
    borderRadius: radius.pill,
    background: colors.primary,
    color: colors.text,
    fontSize: "11px",
    fontWeight: 700,
    boxShadow: "0 0 8px rgba(59,130,246,0.4)",
  },
  userItem: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radius.md,
    transition: transition(["background"]),
    marginBottom: "2px",
  },
  userTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    ...type.callout,
    color: colors.text,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userTags: {
    display: "flex",
    gap: "4px",
    marginTop: "4px",
    flexWrap: "wrap",
  },
  startChatButton: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: colors.primarySoft,
    border: `1px solid ${colors.primaryBorder}`,
    color: colors.primary,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: transition(["background", "transform"]),
    flexShrink: 0,
  },
  noUsersFound: {
    padding: spacing.lg,
    textAlign: "center",
    color: colors.textFaint,
    ...type.footnote,
  },

  // --- Right panel ---
  chatPanel: {
    ...glassCard({ padded: false }),
    padding: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.glassBorder}`,
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: spacing.xl,
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    maxWidth: "72%",
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: radius.lg,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    animation: "iris-slide-in 200ms ease-out",
    boxShadow: "0 4px 14px rgba(0,0,0,0.28)",
  },
  messageText: {
    ...type.body,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  messageTime: {
    ...type.caption,
    alignSelf: "flex-end",
  },
  messageInputWrap: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderTop: `1px solid ${colors.glassBorder}`,
  },
  messageInput: {
    flex: 1,
    padding: `${spacing.md} ${spacing.lg}`,
    background: colors.input,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.pill,
    fontSize: "15px",
    fontFamily: font.family,
    outline: "none",
    transition: transition(["border-color", "background"]),
    boxSizing: "border-box",
  },
  sendButton: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: gradients.brand,
    color: colors.text,
    border: "1px solid rgba(255,255,255,0.10)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: transition(["transform", "opacity", "box-shadow"]),
    boxShadow: "0 6px 18px rgba(59,130,246,0.32)",
  },

  // --- Empty state ---
  emptyChatWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["2xl"],
  },

};

export default Chat;
