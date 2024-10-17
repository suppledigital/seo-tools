// pages/api/projects/[projectId]/save-data.js
import pool from '../../../../server/db'; // Adjust path
import { processDataAndSave } from '../../../../utils/dataProcessor'; // We'll define this utility function

export default async function handler(req, res) {
  const { projectId } = req.query;

  if (req.method === 'POST') {
    const { data } = req.body;

    try {
      await processDataAndSave(projectId, data);

      await pool.query('UPDATE projects SET initialised = 1 WHERE project_id = ?', [projectId]);

      res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
      console.error('Error saving data:', error);
      res.status(500).json({ message: 'Error saving data' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
