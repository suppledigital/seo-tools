// pages/api/task-status.js

export default async function handler(req, res) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  
    const { taskId } = req.query;
  
    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required.' });
    }
  
    try {
      const response = await fetch(`${process.env.STATUS_API_ENDPOINT}?taskId=${taskId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(500).json({ message: `Error fetching task status: ${errorText}` });
      }
  
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error in task-status API:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  