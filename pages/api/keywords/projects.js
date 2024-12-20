// pages/api/keywords/projects.js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  const { name } = req.query;

  try {
    if (name) {
      // Return a single project by name
      const [rows] = await pool.execute('SELECT * FROM main_projects WHERE project_name = ?', [name]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }
      return res.status(200).json(rows[0]);
    } else {
      // Return all projects
      const [rows] = await pool.execute('SELECT * FROM main_projects');
      return res.status(200).json({ projects: rows });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
