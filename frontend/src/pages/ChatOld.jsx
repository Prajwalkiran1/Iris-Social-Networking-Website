import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const chatEndRef = useRef(null);

  // For now this chat view is wired to two fixed users.
  // Backend server runs on port 5001 and exposes /api/messages routes.
  const me = "user1";
  const friend = "user2";

  const API_BASE = "http://localhost:5001/api/messages";

  const fetchChat = async () => {
    const res = await axios.get(`${API_BASE}/chat/${friend}?me=${me}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    await axios.post(`${API_BASE}/send`, {
      sender: me,
      receiver: friend,
      text: text,
    });

    setText("");
    fetchChat();
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.page}>
      <div style={styles.chatContainer}>
        <div style={styles.header}>Chat</div>

        <div style={styles.chatBox}>
          {messages.map((msg, index) => {
            const isMe = msg.sender === me;

            return (
              <div
                key={index}
                style={{
                  ...styles.messageWrapper,
                  justifyContent: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    backgroundColor: isMe ? "#7B2CBF" : "#E0AAFF",
                    color: isMe ? "white" : "#3C096C",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef}></div>
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />

          <button style={styles.button} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#F5F0FF",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Segoe UI",
  },

  chatContainer: {
    width: "420px",
    height: "600px",
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    background: "#7B2CBF",
    color: "white",
    padding: "16px",
    fontSize: "18px",
    fontWeight: "bold",
    textAlign: "center",
  },

  chatBox: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    background: "#F8F4FF",
  },

  messageWrapper: {
    display: "flex",
    marginBottom: "10px",
  },

  messageBubble: {
    padding: "10px 14px",
    borderRadius: "20px",
    maxWidth: "70%",
    fontSize: "14px",
  },

  inputArea: {
    display: "flex",
    padding: "12px",
    borderTop: "1px solid #eee",
    background: "white",
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    outline: "none",
  },

  button: {
    marginLeft: "10px",
    padding: "10px 16px",
    borderRadius: "20px",
    border: "none",
    background: "#7B2CBF",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Chat;