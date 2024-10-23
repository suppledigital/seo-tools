// pages/api/entries/save-classification.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]'; // Adjust the path if necessary
import pool from '../../../../lib/db';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { entry_id, page_type, content_type } = req.body;

    try {
      const updates = {};
      if (page_type !== undefined) updates.page_type = page_type;
      if (content_type !== undefined) updates.content_type = content_type;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No data to update' });
      }

      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = Object.values(updates);

      await pool.query(
        `UPDATE entries SET ${setClause} WHERE entry_id = ?`,
        [...values, entry_id]
      );

      res.status(200).json({ message: 'Classification saved successfully' });
    } catch (error) {
      console.error('Error saving classification:', error);
      res.status(500).json({ message: 'Error saving classification' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
