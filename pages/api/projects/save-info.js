import { getSession } from 'next-auth/react';
import pool from '../../../server/db';

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { project_id, form_data } = req.body;

    try {
      for (const [meta_key, meta_value] of Object.entries(form_data)) {
        // Check if meta_key already exists for the project
        const [existingRows] = await pool.query(
          'SELECT id FROM project_info WHERE project_id = ? AND meta_key = ?',
          [project_id, meta_key]
        );

        if (existingRows.length > 0) {
          // Update existing entry
          await pool.query(
            'UPDATE project_info SET meta_value = ? WHERE id = ?',
            [meta_value, existingRows[0].id]
          );
        } else {
          // Insert new entry
          await pool.query(
            'INSERT INTO project_info (project_id, meta_key, meta_value) VALUES (?, ?, ?)',
            [project_id, meta_key, meta_value]
          );
        }
      }

      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Error saving project information:', error);
      res.status(500).json({ message: 'Error saving project information' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
