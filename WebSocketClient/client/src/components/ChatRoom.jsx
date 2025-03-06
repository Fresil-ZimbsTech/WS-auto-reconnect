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
          <div style={styles.inputContainer}>
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
          {/* <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.button} disabled={!isConnected}>
            Send
          </button> */}
        </div>
      )}
    </div>
  );
};

// const styles = {
//   container: { textAlign: "center", padding: "20px", fontFamily: "Arial, sans-serif" },
//   status: { fontSize: "18px", fontWeight: "bold" },
//   connected: { color: "green" },
//   disconnected: { color: "red" },
//   chatContainer: { width: "50%", margin: "auto", border: "1px solid #ccc", borderRadius: "5px", padding: "10px", minHeight: "200px", overflowY: "auto", background: "#f9f9f9" },
//   messages: { textAlign: "left" },
//   message: { background: "#e1f5fe", padding: "8px", borderRadius: "5px", margin: "5px 0" },
//   notify: { color: "gray", fontStyle: "italic" },
//   input: { width: "40%", padding: "8px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" },
//   button: { padding: "10px 15px", fontSize: "16px", cursor: "pointer", backgroundColor: "#007BFF", color: "#fff", border: "none", borderRadius: "5px" }
// };
const styles = {
  inputContainer: {
    display: "flex",
    width: "100%", // Ensures it matches chatContainer width
    gap: "10px", // Adds space between input and button
    marginTop: "10px",
  },
  // container: {
  //   display: "flex",
  //   flexDirection: "column",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   height: "100vh",
  //   backgroundColor: "#1e1e2e",
  //   color: "#ffffff",
  //   fontFamily: "Arial, sans-serif",
  // },

container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center", // Centers vertically
    alignItems: "center", // Centers horizontally
    height: "100vh", // Full viewport height
    width: "100vw", // Full viewport width (ensures no extra margins)
    backgroundColor: "#1e1e2e",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    margin: 0, // Removes default margin
    padding: 0, // Removes default padding
    overflow: "hidden", // Prevents scrollbars if unnecessary
  },

  status: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  connected: { color: "#4CAF50" }, // Green color for connected
  disconnected: { color: "#FF5252" }, // Red color for disconnected
  // chatContainer: {
  //   width: "60%",
  //   height: "300px",
  //   display: "flex",
  //   flexDirection: "column",
  //   borderRadius: "10px",
  //   padding: "10px",
  //   overflowY: "auto",
  //   backgroundColor: "#282A36",
  //   border: "2px solid #ff79c6",
  // },

  chatContainer: {
    width: "50vw", // Increased width for better visibility
    height: "60vh", // Increased height for better usability
    maxWidth: "600px", // Prevents it from becoming too large
    maxHeight: "500px", // Avoids taking too much space on large screens
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRadius: "12px",
    padding: "15px",
    overflowY: "auto",
    backgroundColor: "#282A36",
    border: "3px solid #ff79c6",
    boxShadow: "0px 4px 10px rgba(255, 121, 198, 0.5)", // Glow effect
  },


  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
  },
  message: {
    background: "#8be9fd",
    color: "#282A36",
    padding: "10px",
    borderRadius: "5px",
    margin: "5px 0",
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  notify: {
    color: "#f1fa8c",
    fontStyle: "italic",
    textAlign: "center",
  },
  input: {
    flex: 1,
    width: "50%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#44475A",
    color: "#FFF",
    fontSize: "16px",
    textAlign: "center",
  },
  button: {
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#FF79C6",
    color: "#1e1e2e",
    border: "none",
    borderRadius: "8px",
    marginTop: "10px",
    transition: "0.3s",
  },
  buttonHover: {
    backgroundColor: "#BD93F9",
  },
};



export default ChatRoom;
