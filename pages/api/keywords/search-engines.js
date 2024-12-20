// pages/api/keywords/search-engines.js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  const { project_id } = req.query;
  if (!project_id) {
    return res.status(400).json({ message: 'Missing project_id parameter' });
  }

  try {
    // Join keywords and search_engines to find distinct engines for this project
    const [rows] = await pool.execute(`
      SELECT DISTINCT se.site_engine_id, se.name
      FROM search_engines se
      JOIN keywords k ON k.search_engine_id = se.site_engine_id
      WHERE k.project_id = ?
    `, [project_id]);

    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
}
