import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { projectId } = req.body;
  const datasetId = 'seranking_data';
  const keywordsTableId = `project_${projectId}_keywords`;
  const projectsTableId = 'projects';

  try {
    // Delete the keywords table for the project
    const keywordsTable = bigquery.dataset(datasetId).table(keywordsTableId);
    await keywordsTable.delete();

    // Delete the project entry from the projects table
    const query = `
      DELETE FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${datasetId}.${projectsTableId}\`
      WHERE id = @projectId
    `;
    const options = {
      query: query,
      params: { projectId: projectId },
    };
    await bigquery.query(options);

    // You may also need to delete entries from the search_engines table
    const searchEnginesTableId = 'search_engines';
    const deleteSearchEnginesQuery = `
      DELETE FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${datasetId}.${searchEnginesTableId}\`
      WHERE site_id = @projectId
    `;
    await bigquery.query({
      query: deleteSearchEnginesQuery,
      params: { projectId: projectId },
    });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Deletion Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
