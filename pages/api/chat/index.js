import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Temporary in-memory store (only works while the server is running)
global.chatMessages = global.chatMessages || {};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { messages, model } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "Missing required parameter: 'messages'" });
    }

    const sessionId = Date.now();
    global.chatMessages[sessionId] = { messages, model }; // Save model with messages

    return res.status(200).json({ message: 'Messages received, starting stream.', sessionId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
