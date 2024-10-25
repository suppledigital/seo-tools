import OpenAI from "openai";
import fetch from 'node-fetch'; // Use node-fetch to handle the request in Node.js
import { Readable } from 'stream';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { sessionId } = req.query;

    // Retrieve stored messages and model for the session
    const chatSession = global.chatMessages[sessionId];
    if (!chatSession) {
      return res.status(400).json({ error: "Session not found." });
    }

    const { messages, model = 'gpt-4o' } = chatSession; // Default to 'gpt' if model is undefined

    if (!messages) {
      return res.status(400).json({ error: "No messages to process" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
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
            max_tokens: 1024,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Anthropic API request failed with status ${response.status}`);
        }

        // Use Node.js stream to handle response.body in a compatible way
        const stream = Readable.from(response.body);


        for await (const chunk of stream) {
          const chunkText = chunk.toString().trim();
         

          // Split chunkText into lines to separate events from data
          const lines = chunkText.split("\n");

          for (let line of lines) {
            line = line.trim();

            if (line.startsWith('event:')) {
              // Ignore the `event:` lines
              continue;
            }

            if (line.startsWith('data:')) {
              const dataLine = line.replace(/^data: /, '').trim();

              try {
                const parsed = JSON.parse(dataLine);

                // Look for the text_delta in content_block_delta
                if (parsed.delta && parsed.delta.text) {
                    const content = parsed.delta.text;

                  // Stream each delta as a new chunk
                    res.write(`data: ${JSON.stringify({ content, model })}\n\n`);
                    res.flush(); // Ensure streaming happens correctly
                            }
              } catch (error) {
                console.error("Failed to parse chunk:", error.message);
              }
            }
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        // Handle GPT model request with OpenAI API
        const completion = await openai.chat.completions.create({
          model,
          messages,
          stream: true,
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          res.write(`data: ${JSON.stringify({ content, model })}\n\n`);
          res.flush(); // Flush after each chunk
        }

        res.write("data: [DONE]\n\n");
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
