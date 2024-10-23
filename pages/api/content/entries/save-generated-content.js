// pages/api/entries/save-generated-content.js
import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { entry_id, generated_content } = req.body;

    try {
      await pool.query(
        'UPDATE entries SET generated_content = ? WHERE entry_id = ?',
        [generated_content, entry_id]
      );
      res.status(200).json({ message: 'Generated content saved successfully.' });
    } catch (error) {
      console.error('Error saving generated content:', error);
      res.status(500).json({ message: 'Error saving generated content.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
