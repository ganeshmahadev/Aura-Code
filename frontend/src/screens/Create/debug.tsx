import React, { useState, useEffect } from "react";
import styled from "styled-components";

const CreateDebug = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState("Not connected");

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog("CreateDebug component mounted");
    
    // Test WebSocket connection
    const testWebSocket = () => {
      addLog("Attempting WebSocket connection...");
      const token = "RXIikfUgLJpEqLpA2t3CSOzoV058gII4jxJzbZqWxExLXb7PQsmqUnKWf6Vti4Qmha9LQF4yS-dGAfJQQbZY1Q==";
      
      try {
        // Use the correct authentication method with query parameter  
        const baseUrl = import.meta.env.VITE_BEAM_WS_URL || "wss://lovable-agent-32a2c27-v3.app.beam.cloud";
        const wsUrl = `${baseUrl}?auth_token=${token}`;
        addLog(`Connecting to: ${baseUrl}`);
        const ws = new WebSocket(wsUrl);
        addLog(`Using authenticated URL with token: ${token.substring(0, 20)}...`);
        
        ws.onopen = () => {
          addLog("✅ WebSocket connected successfully");
          setWsStatus("Connected");
          
          // Test sending INIT message
          const initMessage = {
            type: "init",
            data: {}
          };
          ws.send(JSON.stringify(initMessage));
          addLog("Sent INIT message");
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            addLog(`📨 Received: ${event.data}`);
            
            if (message.type === "init") {
              addLog("🎉 INIT response received!");
              if (message.data && message.data.url) {
                addLog(`🔗 Sandbox URL: ${message.data.url}`);
              }
            } else if (message.type === "ping") {
              // Respond to ping to keep connection alive
              ws.send(JSON.stringify({type: "ping", data: {}}));
            } else {
              addLog(`ℹ️ Message type: ${message.type}`);
            }
          } catch (e) {
            addLog(`📨 Raw received: ${event.data}`);
          }
        };
        
        ws.onerror = (error) => {
          addLog(`❌ WebSocket error: ${error}`);
          setWsStatus("Error");
        };
        
        ws.onclose = (event) => {
          addLog(`🔌 WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
          setWsStatus("Disconnected");
        };
        
      } catch (error) {
        addLog(`❌ WebSocket creation failed: ${error}`);
        setWsStatus("Failed");
      }
    };

    // Test connection after a short delay
    setTimeout(testWebSocket, 1000);
  }, []);

  return (
    <Container>
      <Header>
        <h1>Create Page - Debug Mode</h1>
        <Status status={wsStatus}>WebSocket Status: {wsStatus}</Status>
      </Header>
      
      <TestSection>
        <h3>Connection Test</h3>
        <p>Frontend URL: http://localhost:5173/create</p>
        <p>Agent URL: {import.meta.env.VITE_BEAM_WS_URL || "wss://lovable-agent-32a2c27-v3.app.beam.cloud"}</p>
        <p>MCP URL: https://lovable-mcp-server-6b17ffd-v5.app.beam.cloud/sse</p>
      </TestSection>

      <LogSection>
        <h3>Debug Logs</h3>
        <LogContainer>
          {logs.map((log, index) => (
            <LogEntry key={index}>{log}</LogEntry>
          ))}
        </LogContainer>
      </LogSection>
    </Container>
  );
};

export default CreateDebug;

const Container = styled.div`
  padding: 20px;
  font-family: Arial, sans-serif;
  background: #1a1a1a;
  color: white;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 20px;
`;

const Status = styled.div<{ status: string }>`
  padding: 10px;
  border-radius: 5px;
  background: ${({ status }) => 
    status === "Connected" ? "#22c55e" :
    status === "Error" || status === "Failed" ? "#ef4444" :
    status === "Disconnected" ? "#f59e0b" : "#6b7280"
  };
  color: white;
  font-weight: bold;
  margin-bottom: 20px;
`;

const TestSection = styled.div`
  background: #2a2a2a;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  
  p {
    margin: 5px 0;
    font-family: monospace;
  }
`;

const LogSection = styled.div`
  background: #2a2a2a;
  padding: 15px;
  border-radius: 5px;
`;

const LogContainer = styled.div`
  background: #000;
  padding: 10px;
  border-radius: 3px;
  max-height: 400px;
  overflow-y: auto;
`;

const LogEntry = styled.div`
  font-family: monospace;
  font-size: 12px;
  margin: 2px 0;
  color: #00ff00;
`;