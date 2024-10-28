import OpenAI from "openai";
import fetch from 'node-fetch';
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { sessionId } = req.query;

    const chatSession = global.chatMessages[sessionId];
    if (!chatSession) {
      console.error("Error: Session not found in /api/chat/stream for sessionId:", sessionId);
      return res.status(400).json({ error: "Session not found." });
    }

    const { messages, model = 'gpt-4o' } = chatSession;

    if (!messages) {
      console.error("Error: No messages found in session data for sessionId:", sessionId);
      return res.status(400).json({ error: "No messages to process" });
    }

    console.log("Streaming chat history for sessionId:", sessionId, "with model:", model);
    console.log("Chat history being streamed:", messages);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      let assistantMessage = ""; // Accumulate assistant response here

      if (model.startsWith('claude')) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            max_tokens: 4096,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Anthropic API request failed with status ${response.status}`);
        }

        const stream = Readable.from(response.body);

        for await (const chunk of stream) {
          const chunkText = chunk.toString().trim();
          const lines = chunkText.split("\n");

          for (let line of lines) {
            line = line.trim();

            if (line.startsWith('event:')) continue;

            if (line.startsWith('data:')) {
              const dataLine = line.replace(/^data: /, '').trim();

              try {
                const parsed = JSON.parse(dataLine);

                if (parsed.delta && parsed.delta.text) {
                  const content = parsed.delta.text;
                  assistantMessage += content; // Accumulate the message
                  res.write(`data: ${JSON.stringify({ content, model })}\n\n`);
                  res.flush();
                }
              } catch (error) {
                console.error("Failed to parse chunk:", error.message);
              }
            }
          }
        }

        // Save the full assistant response to the chat history
        global.chatMessages[sessionId].messages.push({ role: "assistant", content: assistantMessage, model });

        res.write("data: " + JSON.stringify({ end: true }) + "\n\n");
        res.end();

      } else {
        const completion = await openai.chat.completions.create({
          model,
          messages,
          stream: true,
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          assistantMessage += content; // Accumulate the message

          // Stream the response to the client
          res.write(`data: ${JSON.stringify({ content, model })}\n\n`);
          res.flush();
        }

        // Save the full assistant response to the chat history
        global.chatMessages[sessionId].messages.push({ role: "assistant", content: assistantMessage, model });

        res.write("data: " + JSON.stringify({ end: true }) + "\n\n");
        res.end();
      }
    } catch (error) {
      console.error("Error with API request:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
