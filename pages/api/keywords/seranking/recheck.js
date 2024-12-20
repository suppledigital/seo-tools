// pages/api/keywords/seranking/recheck.js
import pool from '../../../../lib/db';
import { fetchSERanking } from '../../../../lib/serankingClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { project_id } = req.body;
  if (!project_id) {
    return res.status(400).json({ message: 'Missing project_id' });
  }

  try {
    const keywords = await getAllKeywordsForProject(project_id);
    if (keywords.length === 0) {
      return res.status(400).json({ message: 'No keywords found for project' });
    }

    const payload = { keywords };
    const response = await fetchSERanking(`/sites/${project_id}/recheck/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

async function getAllKeywordsForProject(project_id) {
  const [rows] = await pool.execute(
    'SELECT keyword_id, search_engine_id AS site_engine_id FROM keywords WHERE project_id=?', 
    [project_id]
  );

  // Ensure keyword_id and site_engine_id are numbers
  return rows.map(r => ({
    site_engine_id: Number(r.site_engine_id),
    keyword_id: Number(r.keyword_id)
  }));
}
