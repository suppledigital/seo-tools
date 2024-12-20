// pages/api/keywords/keywords.js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  const { project_id, search_engine_id } = req.query;

  if (!project_id) {
    return res.status(400).json({ message: 'Missing project_id parameter' });
  }

  try {
    let sql = `
      SELECT keyword_id, search_engine_id, keyword, current_ranking, previous_ranking, pos, change_value, is_map,
             map_position, volume, competition, suggested_bid, cpc, results, kei, total_sum, ranking_url
      FROM keywords
      WHERE project_id = ?
    `;

    const params = [project_id];

    if (search_engine_id) {
      sql += ' AND search_engine_id = ?';
      params.push(search_engine_id);
    }

    const [rows] = await pool.execute(sql, params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
