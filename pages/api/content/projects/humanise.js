// pages/api/content/projects/humanise.js

import pool from '../../../../lib/db'; // Ensure the correct path to your DB connection
import OpenAI from 'openai';

// Initialize OpenAI configuration with v4 SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment variables
  // organization: process.env.OPENAI_ORG_ID, // Optional: Set if you have an organization ID
  // project: 'your-project-id', // Optional: Set if you're using project keys
});

// Function to preserve code blocks and HTML tags
const preserveFormatting = (text) => {
  // Regular expression to match <code>...</code> blocks and other HTML tags
  const regex = /<code>[\s\S]*?<\/code>|<[^>]+>/gi;
  const segments = [];
  let lastIndex = 0;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // Add the text before the match as a segment to be humanized
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add the matched HTML tag or code block as a segment to be preserved
    segments.push({
      type: 'preserve',
      content: match[0],
    });

    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return segments;
};

// Function to humanize text using OpenAI's GPT
const humanizeText = async (text) => {
  // Define the enhanced prompt to instruct GPT for paraphrasing
  const prompt = `
You are an experienced content writer specializing in creating clear, engaging, and natural-sounding text. Please rewrite the following content to enhance its readability and flow, ensuring it feels like it was written by a human. Maintain the original meaning and preserve all existing formatting, including HTML tags and code blocks. Avoid using repetitive phrases, unnatural sentence structures, or any terminology that might indicate the text was generated by an artificial intelligence.

Content to rewrite:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Use 'gpt-4' or any available model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // Increased for more creativity and variation
      max_tokens: 1500, // Adjust based on your needs and API limits
      top_p: 0.9, // Increased for greater diversity
      frequency_penalty: 0.2, // Slight penalty to reduce repetition
      presence_penalty: 0.2, // Encourages introducing new topics
    });

    const humanizedText = response.choices[0].message.content.trim();
    return humanizedText;
  } catch (error) {
    console.error('OpenAI API error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to humanize content using OpenAI.');
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { content, entry_id } = req.body;

  // Validate input
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing content' });
  }

  if (!entry_id) {
    return res.status(400).json({ error: 'entry_id is required' });
  }

  try {
    // Preserve formatting by separating text and preserved segments
    const segments = preserveFormatting(content);

    // Humanize only the text segments
    const humanizedSegments = await Promise.all(
      segments.map(async (segment) => {
        if (segment.type === 'text') {
          const humanizedText = await humanizeText(segment.content);
          return humanizedText;
        } else {
          // Preserve HTML tags and code blocks as is
          return segment.content;
        }
      })
    );

    // Reconstruct the humanized content
    const humanizedContent = humanizedSegments.join('');

    // Update the database with the humanized content
    const sql = 'UPDATE entries SET humanized_content = ? WHERE entry_id = ?';
    const values = [humanizedContent, entry_id];

    const [result] = await pool.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.status(200).json({ status: 'success', humanizedContent: humanizedContent });
  } catch (error) {
    console.error('Error processing humanized content:', error);

    // Handle specific OpenAI API errors
    if (error.response) {
      console.error('OpenAI API error:', error.response.status, error.response.data);
      return res.status(error.response.status).json({ error: error.response.data.error || 'OpenAI API error' });
    }

    res.status(500).json({ error: 'An error occurred while processing the content' });
  }
}
