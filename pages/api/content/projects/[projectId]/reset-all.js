// pages/api/projects/[projectId]/reset-all.js
import { getSession } from 'next-auth/react';
import pool from '../../../../../lib/db';

export default async function handler(req, res) {
  const { projectId } = req.query;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch the user from the users table
    const [userRows] = await pool.query(
      'SELECT permissions_level FROM users WHERE email = ?',
      [session.user.email]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Fetch the project to check ownership
    const [projectRows] = await pool.query(
      'SELECT user_email FROM projects WHERE project_id = ?',
      [projectId]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectRows[0];

    // Check if the user is the owner or an admin
    if (project.user_email !== session.user.email && user.permissions_level !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete entries associated with the project
    await pool.query('DELETE FROM entries WHERE project_id = ?', [projectId]);

    // Reset project info except for project_id, project_name, created_at
    await pool.query(
      `UPDATE projects SET
        initialised = 0,
        business_name = NULL,
        phone_number = NULL,
        physical_location = NULL,
        services_products = NULL,
        primary_usp = NULL,
        secondary_usp = NULL,
        home_content = NULL,
        about_us_content = NULL,
        target_locations = NULL,
        tone = NULL,
        grammar = NULL,
        additional_notes = NULL
      WHERE project_id = ?`,
      [projectId]
    );

    return res.status(200).json({ message: 'Project fully reset successfully' });
  } catch (error) {
    console.error('Error resetting all project data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
