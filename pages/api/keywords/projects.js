// pages/api/keywords/projects.js
import pool from '../../../lib/db';

export default async function handler(req, res) {
  const { name, search_engine_id } = req.query;

  try {
    if (!name) {
      const [projects] = await pool.execute('SELECT * FROM main_projects');
      return res.status(200).json({ projects });
    }

    const [rows] = await pool.execute('SELECT * FROM main_projects WHERE project_name = ?', [name]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    let project = rows[0];

    if (search_engine_id) {
      // Recalculate only those metrics we can from keywords
      const [kwRows] = await pool.execute(`
        SELECT 
          COUNT(*) as number_of_keywords,
          AVG(current_ranking) as today_avg,
          AVG(previous_ranking) as yesterday_avg,
          SUM(CASE WHEN change_value > 0 THEN 1 ELSE 0 END) as total_up,
          SUM(CASE WHEN change_value < 0 THEN 1 ELSE 0 END) as total_down,
          SUM(CASE WHEN pos <=5 AND pos > 0 THEN 1 ELSE 0 END) as top5,
          SUM(CASE WHEN pos <=10 AND pos > 0 THEN 1 ELSE 0 END) as top10,
          SUM(CASE WHEN pos <=30 AND pos > 0 THEN 1 ELSE 0 END) as top30
        FROM keywords
        WHERE project_id = ? AND search_engine_id = ?
      `, [project.project_id, search_engine_id]);

      if (kwRows.length > 0) {
        const agg = kwRows[0];
        project.number_of_keywords = agg.number_of_keywords || 0;
        project.today_avg = agg.today_avg || 0;
        project.yesterday_avg = agg.yesterday_avg || 0;
        project.total_up = agg.total_up || 0;
        project.total_down = agg.total_down || 0;
        project.top5 = agg.top5 || 0;
        project.top10 = agg.top10 || 0;
        project.top30 = agg.top30 || 0;

        // visibility and visibility_percent remain from project table as is
        // since we cannot recalculate them from keywords
      }
    }

    return res.status(200).json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
