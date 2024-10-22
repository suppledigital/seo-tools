// pages/api/entries/[entryId].js
import pool from '../../../server/db';

export default async function handler(req, res) {
  const { entryId } = req.query;

  if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM entries WHERE entry_id = ?', [entryId]);
      res.status(200).json({ message: 'Entry deleted successfully.' });
    } catch (error) {
      console.error('Error deleting entry:', error);
      res.status(500).json({ message: 'Error deleting entry.' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
