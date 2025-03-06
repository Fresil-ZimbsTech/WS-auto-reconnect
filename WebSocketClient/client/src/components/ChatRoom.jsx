import React, { useState, useEffect, useRef, useCallback } from "react";

const ChatRoom = () => {
  const [userName, setUserName] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);

  const connectWebSocket = useCallback(() => {
    if (!userName) return;

    const url = `ws://localhost:5000/ws?name=${encodeURIComponent(userName)}`;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket is already open.");
      return;
    }

    console.log("Connecting to WebSocket...");
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      clearTimeout(reconnectTimeout.current);
    };

    socketRef.current.onmessage = (event) => {
      const message = event.data;

      if (message.includes("Users online:")) {
        const count = parseInt(message.split("Users online: ")[1], 10);
        if (!isNaN(count)) setUserCount(count);
      }

      setMessages((prev) => [...prev, message]);
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);

      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connectWebSocket();
        }, 3000);
      }
    };
  }, [userName]);

  useEffect(() => {
    if (isNameEntered) connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket, isNameEntered]);

  const sendMessage = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div style={styles.container}>
      {!isNameEntered ? (
        <div>
          <h2>Enter Your Name</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            style={styles.input}
          />
          <button onClick={() => setIsNameEntered(true)} style={styles.button} disabled={!userName}>
            Join Chat
          </button>
        </div>
      ) : (
        <div>
          <h2>WebSocket Chat Room</h2>
          <p style={styles.status}>
            Status: <span style={isConnected ? styles.connected : styles.disconnected}>
              {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </span>
          </p>
          <p><b>Users online:</b> {userCount}</p>
          <div style={styles.chatContainer}>
            <div style={styles.messages}>
              {messages.map((msg, index) => (
                <p key={index} style={msg.includes("joined") || msg.includes("left") ? styles.notify : styles.message}>
                  {msg}
                </p>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.button} disabled={!isConnected}>
            Send
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { textAlign: "center", padding: "20px", fontFamily: "Arial, sans-serif" },
  status: { fontSize: "18px", fontWeight: "bold" },
  connected: { color: "green" },
  disconnected: { color: "red" },
  chatContainer: { width: "50%", margin: "auto", border: "1px solid #ccc", borderRadius: "5px", padding: "10px", minHeight: "200px", overflowY: "auto", background: "#f9f9f9" },
  messages: { textAlign: "left" },
  message: { background: "#e1f5fe", padding: "8px", borderRadius: "5px", margin: "5px 0" },
  notify: { color: "gray", fontStyle: "italic" },
  input: { width: "40%", padding: "8px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "10px 15px", fontSize: "16px", cursor: "pointer", backgroundColor: "#007BFF", color: "#fff", border: "none", borderRadius: "5px" }
};

export default ChatRoom;
