// pages/api/projects/[projectId]/run-prompt.js
import pool from '../../../../server/db';
import axios from 'axios';

export default async function handler(req, res) {
  const { projectId } = req.query;

  if (req.method === 'POST') {
    const { promptId, urls } = req.body;

    try {
      const [promptRows] = await pool.query(
        'SELECT prompt_text FROM prompts WHERE id = ?',
        [promptId]
      );

      if (promptRows.length === 0) {
        return res.status(404).json({ message: 'Prompt not found' });
      }

      const promptText = promptRows[0].prompt_text;
      const urlList = urls.join('\n');
      const fullPrompt = `${promptText}\n${urlList}`;

      const response = await runPrompt(fullPrompt);

      if (!response) {
        return res.status(500).json({ message: 'Error calling AI API' });
      }

      res.status(200).json({ data: response });
    } catch (error) {
      console.error('Error running prompt:', error);
      res.status(500).json({ message: 'Error running prompt' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function runPrompt(prompt) {
  const apiUrl = 'https://api.anthropic.com/v1/messages';
  const apiKey = process.env.CLAUDE_API_KEY;

  const data = {
    model: 'claude-3-5-sonnet-20240620',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 8000,
    temperature: 1.0,
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  try {
    const response = await axios.post(apiUrl, data, { headers });
    const assistantMessage = response.data;

    if (!assistantMessage.content || !Array.isArray(assistantMessage.content)) {
      console.error('Invalid response from Claude API:', assistantMessage);
      return null;
    }

    const assistantReply = assistantMessage.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return assistantReply;
  } catch (error) {
    console.error(
      'Error calling Claude API:',
      error.response ? error.response.data : error
    );
    return null;
  }
}
