// pages/api/trello-audit/get-cards.js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const [rows] = await pool.execute(`
      SELECT
        c.*,
        GROUP_CONCAT(LEFT(m.full_name, 1)) AS member_initials
      FROM
        cards c
      LEFT JOIN
        card_members cm ON c.card_id = cm.card_id
      LEFT JOIN
        members m ON cm.member_id = m.member_id
      GROUP BY
        c.card_id
    `);

    res.status(200).json({ cards: rows });
  } catch (error) {
    console.error('Error fetching cards from database:', error);
    res.status(500).json({ error: 'Error fetching cards from database' });
  }
}
