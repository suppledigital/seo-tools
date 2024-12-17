// pages/api/enqueue-task.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  
    const { systemPrompt, userPrompt } = req.body;
  
    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ message: 'systemPrompt and userPrompt are required.' });
    }
  
    try {
      const response = await fetch(process.env.SQS_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(500).json({ message: `Error enqueuing task: ${errorText}` });
      }
  
      const data = await response.json();
      return res.status(202).json(data); // 202 Accepted
    } catch (error) {
      console.error('Error in enqueue-task API:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  