import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

global.chatMessages = global.chatMessages || {};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let { messages, model, sessionId } = req.body;

    // If sessionId is not provided, generate a new one
    if (!sessionId) {
      sessionId = Date.now().toString(); // Simple sessionId using current timestamp
      console.log("Generated new sessionId:", sessionId);
    }

    if (!messages) {
      console.error("Error: 'messages' parameter is missing in request body.");
      return res.status(400).json({ error: "Missing required parameter: 'messages'" });
    }

    // Initialize session in global chatMessages if it does not exist
    if (!global.chatMessages[sessionId]) {
      global.chatMessages[sessionId] = { messages: [], model };
    }

    // Append new message(s) to existing history
    global.chatMessages[sessionId].messages.push(...messages);

    console.log("Session initialized or updated in /api/chat:", {
      sessionId,
      chatHistory: global.chatMessages[sessionId],
    });

    // Return the sessionId in the response for future use
    return res.status(200).json({ message: 'Messages received, starting stream.', sessionId });
  }

  console.error("Error: Unsupported HTTP method used.");
  return res.status(405).json({ error: 'Method not allowed' });
}
