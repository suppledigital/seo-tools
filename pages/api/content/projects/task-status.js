// pages/api/content/projects/task-status.js
import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ success: false, message: 'taskId is required.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT status, result, error, project_id, entry_id, task_type FROM tasks WHERE task_id = ? LIMIT 1',
      [taskId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { status, result, error, project_id, entry_id, task_type } = rows[0];

    // If completed or failed, remove the corresponding task_id
    if (status === 'Completed' || status === 'Failed') {
      if (task_type === 'generate-content') {
        await pool.query(
          'UPDATE entries SET task_id_generate = NULL WHERE project_id = ? AND entry_id = ?',
          [project_id, entry_id]
        );
      } else if (task_type === 'humanise-content') {
        await pool.query(
          'UPDATE entries SET task_id_humanise = NULL WHERE project_id = ? AND entry_id = ?',
          [project_id, entry_id]
        );
      }
    }

    // Fetch the updated_at field from entries to return
    const [entryRows] = await pool.query(
      'SELECT updated_at FROM entries WHERE project_id = ? AND entry_id = ?',
      [project_id, entry_id]
    );

    let updated_at = null;
    if (entryRows.length > 0) {
      updated_at = entryRows[0].updated_at;
    }

    return res.status(200).json({
      success: true,
      task_status: status,
      result: status === 'Completed' ? result : null,
      error: status === 'Failed' ? error : null,
      updated_at: updated_at ? updated_at : null
    });
  } catch (error) {
    console.error('Error in task-status API:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch task status.' });
  }
}
