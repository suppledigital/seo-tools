// pages/api/prompts.js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  const { page_type, content_type } = req.query;

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        'SELECT prompt_text FROM prompts WHERE page_type = ? AND content_type = ?',
        [page_type, content_type]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Prompt not found' });
      }

      const prompt_text = rows[0].prompt_text;
      res.status(200).json({ prompt_text });
    } catch (error) {
      console.error('Error fetching prompt:', error);
      res.status(500).json({ message: 'Error fetching prompt' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
