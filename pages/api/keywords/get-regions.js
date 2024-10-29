// pages/api/keywords/get-regions.js

import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

export default async function handler(req, res) {
  const { projectId } = req.query;
  const datasetId = 'seranking_data';
  const searchEnginesTableId = 'search_engines';

  try {
    const query = `
      SELECT site_engine_id, region_name
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${datasetId}.${searchEnginesTableId}\`
      WHERE site_id = @projectId
    `;
    const options = {
      query: query,
      params: { projectId: parseInt(projectId) },
    };

    const [rows] = await bigquery.query(options);

    res.status(200).json({ regions: rows });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
