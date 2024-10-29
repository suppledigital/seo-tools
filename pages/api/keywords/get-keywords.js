// pages/api/keywords/get-keywords.js

import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

export default async function handler(req, res) {
    const { projectId, siteEngineId } = req.query;
    const datasetId = 'seranking_data';
    const keywordsTableId = `project_${projectId}_keywords`;
  
    try {
      const query = `
        SELECT keyword_id, keyword, positions, landing_pages, volume, competition, suggested_bid, kei, results, total_sum
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${datasetId}.${keywordsTableId}\`
        WHERE site_engine_id = @siteEngineId
      `;
      const options = {
        query: query,
        params: { siteEngineId: parseInt(siteEngineId) },
      };
  
      const [rows] = await bigquery.query(options);
  
      // Helper function to extract primitive values
      function getPrimitiveValue(field) {
        if (field == null) {
          return null;
        } else if (typeof field === 'object' && 'value' in field) {
          return field.value;
        } else {
          return field;
        }
      }
  
      // Flatten positions and ensure primitive values
      const formattedKeywords = rows.map(row => {
        const latestPosition = row.positions && row.positions.length > 0
          ? row.positions[row.positions.length - 1]
          : {};
          const landingURL = row.landing_pages && row.landing_pages.length > 0
          ? row.landing_pages[row.landing_pages.length - 1]
          : {};
        return {
          keyword_id: getPrimitiveValue(row.keyword_id),
          keyword: row.keyword || '',
          position: getPrimitiveValue(latestPosition.pos),
          date: getPrimitiveValue(latestPosition.date),
          landing_pages: getPrimitiveValue(landingURL.url)
        // Add other fields as needed
    };
});
console.log('Formatted Keywords:', JSON.stringify(formattedKeywords, null, 2));


res.status(200).json({ keywords: formattedKeywords });
} catch (error) {
console.error('Error fetching keywords:', error);
res.status(500).json({ error: 'Internal Server Error' });
}
}