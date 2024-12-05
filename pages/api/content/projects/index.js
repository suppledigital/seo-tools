// pages/api/projects/index.js
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { method } = req;

  if (method === 'GET') {
    // Fetch projects with user names
    try {
      const [rows] = await pool.query(
        `SELECT projects.*, users.name
         FROM projects
         LEFT JOIN users ON projects.user_email = users.email`
      );
      res.status(200).json({ projects: rows });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Error fetching projects' });
    }
  }   else if (method === 'POST') {
    // Add new project
    const { project_name } = req.body;
    try {
      await pool.query(
        'INSERT INTO projects (project_name, user_email) VALUES (?, ?)',
        [project_name, session.user.email]
      );
      res.status(201).json({ message: 'Project added' });
    } catch (error) {
      console.error('Error adding project:', error);
      res.status(500).json({ message: 'Error adding project' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
