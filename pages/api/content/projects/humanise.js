// pages/api/content/projects/humanise.js

import pool from '../../../../lib/db'; // Ensure this path is correct
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // For generating unique task IDs

export default async function handler(req, res) {
  console.log(`Received ${req.method} request at /api/content/projects/humanise`);

  if (req.method !== 'POST') {
    console.warn(`Method ${req.method} not allowed on /api/content/projects/humanise`);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { project_id, entry_id, task_type } = req.body;

  if (!project_id || !entry_id || !task_type) {
    console.warn('Missing required fields:', req.body);
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  let task_id = null;

  try {
    // Step 1: Create a new task in the tasks table
    task_id = uuidv4(); // Generate a unique task ID
    console.log(task_type);

    const [insertResult] = await pool.query(
      'INSERT INTO tasks (task_id, project_id, entry_id, task_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [task_id, project_id, entry_id, task_type, 'Queued']
    );

    if (insertResult.affectedRows === 0) {
      console.warn(`Failed to create task for project_id=${project_id} and entry_id=${entry_id}`);
      return res.status(500).json({ success: false, message: 'Failed to create task.' });
    }

    // Step 2: Link the task ID to the entries table
    if (task_type === 'humanise-content') {
      await pool.query(
        'UPDATE entries SET task_id_humanise = ? WHERE project_id = ? AND entry_id = ?',
        [task_id, project_id, entry_id]
      );
    } else {
      throw new Error(`Unsupported task type: ${task_type}`);
    }

    // Step 3: Enqueue the task to AWS by calling the internal AWS API endpoint
    const processTaskEndpoint = process.env.PROCESS_TASK_API_ENDPOINT;

    if (!processTaskEndpoint) {
      throw new Error('processTaskEndpoint is not defined in environment variables.');
    }

    // Payload to send to AWS
    const payload = {
      task_type,
      project_id,
      entry_id,
      task_id, // Include task_id to track it
    };

    axios.post(processTaskEndpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 1000 // or shorter
    }).catch(err => {
      console.error("Failed to call process-task endpoint:", err.message);
    });
  
    // Immediately return success to the frontend
    return res.status(200).json({ 
      success: true, 
      message: 'Task enqueued successfully.',
      task_id: task_id // Include the newly created task_id
    });

  } catch (error) {
    console.error('Error in humanise API:', error.message);

    // Optionally, revert the task creation in case of failure
    try {
      if (task_id) {
        await pool.query(
          'DELETE FROM tasks WHERE task_id = ?',
          [task_id]
        );
        console.log(`Reverted task creation for task_id=${task_id}`);
      }
    } catch (revertError) {
      console.error('Error reverting task creation:', revertError.message);
    }

    return res.status(500).json({ success: false, message: 'Failed to enqueue task.' });
  }
}
