// pages/api/webceo-keywords/fetchProject.js
import { fetchLandingPages, fetchRankings } from '../../../utils/webceo';
import { createExcelFile } from '../../../utils/excel';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { projectId, projectName } = req.body;

    if (!projectId || !projectName) {
      return res.status(400).json({ error: 'Project ID and Name are required' });
    }

    try {
      const [landingPagesData, rankingsData] = await Promise.all([
        fetchLandingPages(projectId),
        fetchRankings(projectId, { history_depth: 1000 }), // Adjust history_depth as needed
      ]);

      // Log the fetched data for debugging
      console.log(`Fetched landing pages for project "${projectName}":`, landingPagesData);
      console.log(`Fetched rankings for project "${projectName}":`, rankingsData);

      // Correctly access the nested 'data' properties
      const data = {
        landingPages: landingPagesData.data?.urls || [],
        rankings: rankingsData.data?.ranking_data || [],
      };

      // Additional logging to verify data integrity
      console.log(`Processed Landing Pages Count for "${projectName}":`, data.landingPages.length);
      console.log(`Processed Rankings Count for "${projectName}":`, data.rankings.length);

      // Validate that the expected arrays are present
      if (!Array.isArray(data.landingPages) || !Array.isArray(data.rankings)) {
        throw new Error('Invalid data structure received from WebCEO API.');
      }

      // Create Excel File
      const sanitizedProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${sanitizedProjectName}_${Date.now()}.xlsx`; // Append timestamp for uniqueness
      const filePath = path.join(process.cwd(), 'public', 'excel', fileName);

      await createExcelFile(data, filePath);

      console.log(`Excel file created for project "${projectName}" at: ${filePath}`);

      res.status(200).json({
        message: `Project data fetched and Excel file created for "${projectName}"`,
        file: `/excel/${fileName}`,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching project data:', error);
      res.status(500).json({ error: 'Failed to fetch project data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
