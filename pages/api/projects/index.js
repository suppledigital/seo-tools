// pages/api/projects/index.js
import pool from '../../../server/db'; // Adjust the path to your db file
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Adjust the path if necessary

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { method } = req;

  if (method === 'GET') {
    // Fetch projects
    try {
      const [rows] = await pool.query('SELECT * FROM projects');
      res.status(200).json({ projects: rows });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'Error fetching projects' });
    }
  } else if (method === 'POST') {
    // Add new project
    const { project_name } = req.body;
    try {
      await pool.query('INSERT INTO projects (project_name) VALUES (?)', [project_name]);
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
