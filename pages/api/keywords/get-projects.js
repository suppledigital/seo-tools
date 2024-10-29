// pages/api/get-projects.js

import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';

const bigquery = new BigQuery({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
  
export default async function handler(req, res) {
  try {
    const query = `
        SELECT id, title, keyword_count
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.seranking_data.projects\`
        `;


    const [rows] = await bigquery.query({ query });

    res.status(200).json({ projects: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
