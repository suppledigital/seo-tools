const WebSocket = require('ws');

(async () => {
  const fetch = (await import('node-fetch')).default;
  const wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    let sessionId = null;

    ws.on('message', async (message) => {
      try {
        const { message: userMessage, model } = JSON.parse(message);

        if (!sessionId) {
          // First message: initialize session
          const initResponse = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: "user", content: userMessage }], model }),
          });
          const initData = await initResponse.json();
          sessionId = initData.sessionId; // Capture session ID from response
          console.log("Initialized session with sessionId:", sessionId);
        } else {
          // Subsequent messages use the existing session
          await fetch(`http://localhost:3000/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: "user", content: userMessage }], model, sessionId }),
          });
        }

        const streamResponse = await fetch(`http://localhost:3000/api/chat/stream?sessionId=${sessionId}&model=${model}`);

        if (!streamResponse.ok) {
          ws.send(JSON.stringify({ error: "Streaming API request failed" }));
          return;
        }

        streamResponse.body.on('data', (chunk) => {
          const data = chunk.toString().trim();
          if (data.startsWith('data: ')) {
            const jsonData = data.slice(6).trim();
            try {
              const parsedData = JSON.parse(jsonData);
              ws.send(JSON.stringify(parsedData));
            } catch (error) {
              console.error("Failed to parse JSON data:", error.message, "Data:", jsonData);
            }
          }
        });

        streamResponse.body.on('end', () => {
          ws.send(JSON.stringify({ message: "[DONE]" }));
        });

      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        ws.send(JSON.stringify({ error: "Internal Server Error" }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      sessionId = null;
    });
  });

  console.log('WebSocket server is running on ws://localhost:8080');
})();
