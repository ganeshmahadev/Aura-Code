import React from "react";
import { Route, Routes } from "react-router-dom";

// Minimal Create component for testing
const DebugCreate = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Create Page - Debug Mode</h1>
      <div style={{ display: "flex", gap: "20px", height: "500px" }}>
        <div style={{ flex: 1, border: "1px solid #ccc", padding: "10px" }}>
          <h3>Chat Sidebar</h3>
          <p>WebSocket URL: wss://lovable-agent-32a2c27-v2.app.beam.cloud</p>
          <p>Status: Testing connection...</p>
          <input placeholder="Enter your message" style={{ width: "100%", marginBottom: "10px" }} />
          <button>Send</button>
        </div>
        <div style={{ flex: 2, border: "1px solid #ccc", padding: "10px" }}>
          <h3>Preview Panel</h3>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button style={{ padding: "5px 15px" }}>Preview</button>
            <button style={{ padding: "5px 15px" }}>Code</button>
          </div>
          <div style={{ height: "400px", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Preview/Code content will appear here
          </div>
        </div>
      </div>
    </div>
  );
};

// Minimal New component for testing
const DebugNew = () => {
  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "Arial, sans-serif", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <h1>What do you want to build?</h1>
      <p>Build a website with Beam Sandboxes - Debug Mode</p>
      <div style={{ width: "100%", maxWidth: "600px", marginTop: "20px" }}>
        <textarea 
          rows={3} 
          placeholder="What do you want to build?" 
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />
        <button 
          style={{ padding: "10px 20px", fontSize: "16px" }}
          onClick={() => window.location.href = "/create"}
        >
          Start Building
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1a1a1a", color: "white" }}>
      <Routes>
        <Route path="/" element={<DebugNew />} />
        <Route path="/create" element={<DebugCreate />} />
      </Routes>
    </div>
  );
};

export default App;