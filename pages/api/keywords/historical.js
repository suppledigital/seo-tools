// pages/api/keywords/historical.js
import { getKeywordPositions } from '../../../lib/serankingClient';
import dayjs from 'dayjs';

export default async function handler(req, res) {
  const { project_id, search_engine_id } = req.query;
  if (!project_id) return res.status(400).json({ message: 'Missing project_id' });

  try {
    const date_to = dayjs().format('YYYY-MM-DD');
    const date_from = dayjs().subtract(10, 'year').format('YYYY-MM-DD');

    // Fetch historical data from SERanking
    const positionsData = await getKeywordPositions(project_id, {
      date_from,
      date_to,
      site_engine_id: search_engine_id || null
    });
  //  console.log(JSON.stringify(positionsData));


    // positionsData: array of { site_engine_id, keywords: [{id, name, positions: [...]}, ...] }
    // For simplicity, let's flatten this to a simple array of historical records:
    const historicalRecords = [];
    for (const engineData of positionsData) {
      for (const kwData of engineData.keywords) {
        // kwData.positions is an array of { date, pos, change, ... } over time
        // Include all positions as historical records
        for (const posEntry of kwData.positions) {
          historicalRecords.push({
            keyword_id: kwData.id,
            keyword: kwData.name,
            date: posEntry.date,
            pos: posEntry.pos,
            change: posEntry.change,
            ranking_url: posEntry.url
          });
        }
      }
    }
   // console.log(JSON.stringify(historicalRecords));


    return res.status(200).json(historicalRecords);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
}
