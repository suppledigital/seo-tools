// pages/api/keywords/seranking/status.js
import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Fetch current status from DB
  const [rows] = await pool.query('SELECT * FROM import_status ORDER BY id DESC LIMIT 1');
  if (rows.length === 0) {
    return res.status(200).json({ status: 'No import running.' });
  }

  res.status(200).json(rows[0]);
}
