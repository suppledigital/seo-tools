// pages/api/keywords/get-search-engines.js

import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

export default async function handler(req, res) {
  try {
    const query = `
      SELECT site_id, site_engine_id, region_name
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.seranking_data.search_engines\`
    `;

    const [rows] = await bigquery.query({ query });

    res.status(200).json({ searchEngines: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
