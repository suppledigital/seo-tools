import { getSession } from 'next-auth/react';
import pool from '../../../../../lib/db'; // Adjust if your db file is at a different path

/**
 * Fetch all projects from DB that a content writer or PM can see.
 * You can implement your own authentication/authorization logic as needed.
 */
export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    try {
      // Example: fetch all projects. Filter by user_email if you only want
      // them to see their own. For now, we fetch all.
      const [rows] = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');

      // Return them. In the front-end, each project is displayed in the Editor home.
      return res.status(200).json({ projects: rows });
    } catch (error) {
      console.error('Error fetching projects:', error);
      return res.status(500).json({ error: 'Error fetching projects' });
    }
  } else {
    // If you need to handle POST (create a new project in "editor" context), do it here
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
