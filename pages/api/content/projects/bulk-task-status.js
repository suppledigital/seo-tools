// pages/api/bulk-task-status.js

import mysql from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { taskIds } = req.body;
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({ message: 'taskIds must be a non-empty array.' });
  }

  try {
    const placeholders = taskIds.map(() => '?').join(',');
    const query = `
      SELECT task_id, status, result, error, updated_at, task_type
      FROM tasks
      WHERE task_id IN (${placeholders})
    `;
    const [rows] = await mysql.query(query, taskIds);

    const results = {};
    for (const row of rows) {
      results[row.task_id] = {
        status: row.status,
        result: row.result,
        error: row.error,
        updated_at: row.updated_at,
        task_type: row.task_type
      };
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in bulk-task-status API:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
