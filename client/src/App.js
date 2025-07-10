import React, { useState, useEffect, useRef } from "react";
import "./App.css"; 
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const socketRef = useRef(null);

  useEffect(() => {
  const socket = new WebSocket(
  window.location.hostname === "localhost"
    ? "ws://localhost:5000"
    : "wss://" + window.location.host
);




    socketRef.current = socket;

    const params = new URLSearchParams(window.location.search);
    const idFromURL = params.get("id");

    socket.onopen = () => {
      setStatus("Connected");
      socket.send(JSON.stringify({ type: "join", id: idFromURL }));
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "joined") {
        setSessionId(msg.id);
        window.history.replaceState(null, "", `?id=${msg.id}`);
      }

      if (msg.type === "text") {
        setText(msg.data);
      }
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    socket.onclose = () => {
      setStatus("Disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "text", data: newText, id: sessionId }));
    }
  };

  const handleCustomLink = () => {
    if (!customLink.trim()) return;
    window.location.href = `?id=${customLink}`;
  };

  const handleClear = () => {
  setText("");

  const socket = socketRef.current;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "text", data: "", id: sessionId }));
  }
};


  const handleCopy = () => {
    const fullLink = `${window.location.origin}?id=${sessionId}`;
    navigator.clipboard.writeText(fullLink);
    alert("Link copied to clipboard!");
  };

   const textCopy = async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    alert("Text copied to clipboard!");
  } catch (err) {
    alert("Failed to copy text!");
    console.error(err);
  }
};

  return (
    <div className="container-fluid text-white" style={{ backgroundColor: "#121212", minHeight: "100vh", padding: "2rem" }}>
      <div className="row">
        <div className="col-md-5">
          <h2 className="mb-4">Share Text</h2>
           <p><strong>{sessionId ? `Connected in room: ${sessionId}` : "No room joined"}</strong></p>

        <div className="d-flex flex-column flex-md-row mb-3">
  <input
    type="text"
    className="form-control bg-dark text-white mb-2 mb-md-0"
    placeholder="sharetxt.live/name"
    value={customLink}
    onChange={(e) => setCustomLink(e.target.value)}
  />

  <button
    className="btn btn-danger w-100 w-md-50 mx-md-3 mb-2 mb-md-0"
    onClick={handleCustomLink}
  >
    Claim my link
  </button>

  <button
    className="btn btn-secondary w-100 w-md-50"
    onClick={() => {
      window.location.href = "?id=public";
    }}
  >
    Join Public Room
  </button>
</div>


          {sessionId && (
            <div className="mb-3">
              <strong>Link:</strong><br />
              <span className="text-info">{`${window.location.origin}?id=${sessionId}`}</span>
              <br />
              <button className="btn btn-sm btn-outline-light mt-2" onClick={handleCopy}>
                Copy Link
              </button>
            </div>
          )}

          <p className="text-secondary">
            <strong>Status:</strong> {status}
          </p>
        </div>

        <div className="col-md-7">
          <textarea
            className="form-control bg-dark text-white"
            rows="15"
            value={text}
            onChange={handleChange}
            placeholder="Type or paste text to share..."
          />

          <div className="d-flex justify-content-between mt-2 text-secondary">
            <span>{text.split(/\s+/).filter(Boolean).length} words</span>
            <span>{text.length} chars</span>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-success me-2" onClick={textCopy}>Copy</button>
            <button className="btn btn-danger" onClick={handleClear}>Clear</button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
