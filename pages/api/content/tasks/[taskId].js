// pages/api/content/tasks/[taskId].js

import pool from '../../../../lib/db';

export default async function handler(req, res) {
  const { taskId } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const [taskRows] = await pool.query('SELECT * FROM tasks WHERE task_id = ?', [taskId]);
    const task = taskRows[0];

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json({
      task_id: task.task_id,
      project_id: task.project_id,
      entry_id: task.entry_id,
      task_type: task.task_type,
      status: task.status,
      result: task.result || null,
      error: task.error || null,
      created_at: task.created_at,
      updated_at: task.updated_at,
    });
  } catch (error) {
    console.error('Error fetching task status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
