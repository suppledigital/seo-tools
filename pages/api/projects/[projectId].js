// pages/api/projects/[projectId].js
import pool from '../../../server/db'; // Adjust path if necessary

export default async function handler(req, res) {
  const { projectId } = req.query;

  if (req.method === 'GET') {
    try {
      const [projectRows] = await pool.query(
        'SELECT * FROM projects WHERE project_id = ?',
        [projectId]
      );
      const project = projectRows[0];

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      if (project.initialised) {
        const [entryRows] = await pool.query(
          'SELECT * FROM entries WHERE project_id = ?',
          [projectId]
        );
        return res.status(200).json({ project, entries: entryRows });
      }

      return res.status(200).json({ project });
    } catch (error) {
      console.error('Error fetching project data:', error);
      res.status(500).json({ message: 'Error fetching project data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
