// pages/api/webceo-keywords/fetchAll.js
import { fetchProjects, fetchLandingPages, fetchRankings } from '../../../utils/webceo';
import { createExcelFile } from '../../../utils/excel';
import path from 'path';
import pLimit from 'p-limit';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const filters = {}; // Add any necessary filters here, e.g., user, suspended
      // Example filter for active projects only:
      // const filters = { suspended: 0 };
      const projectsData = await fetchProjects(filters);

      if (!projectsData || !projectsData.data || projectsData.data.length === 0) {
        return res.status(404).json({ error: 'No projects found' });
      }

      const limit = pLimit(1); // Limit to 5 concurrent promises
      const results = await Promise.all(
        projectsData.data.map((project) =>
          limit(async () => {
            const { project: projectId, domain: projectName, suspended } = project;
            try {
              const [landingPagesData, rankingsData] = await Promise.all([
                fetchLandingPages(projectId),
                fetchRankings(projectId, { history_depth: 1000 }), // Adjust history_depth as needed
              ]);

              // Log fetched data counts
              console.log(`Fetched landing pages for "${projectName}":`, landingPagesData.data?.urls?.length || 0);
              console.log(`Fetched rankings for "${projectName}":`, rankingsData.data?.ranking_data?.length || 0);

              const data = {
                landingPages: landingPagesData.data?.urls || [],
                rankings: rankingsData.data?.ranking_data || [],
              };

              if (!Array.isArray(data.landingPages) || !Array.isArray(data.rankings)) {
                throw new Error('Invalid data structure received from WebCEO API.');
              }

              // Create Excel File
              const sanitizedProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              const fileName = `${sanitizedProjectName}_${Date.now()}.xlsx`; // Append timestamp for uniqueness
              const filePath = path.join(process.cwd(), 'public', 'excel', fileName);

              await createExcelFile(data, filePath);

              console.log(`Excel file created for "${projectName}" at: ${filePath}`);

              return {
                project: projectName,
                file: `/excel/${fileName}`,
                createdAt: new Date().toISOString(),
                suspended: suspended || 0,
                status: 'Success',
              };
            } catch (err) {
              console.error(`Error fetching data for project "${projectName}":`, err.message);
              return {
                project: projectName,
                status: 'Failed',
                error: err.message,
              };
            }
          })
        )
      );

      res.status(200).json({ message: 'All projects fetched', results });
    } catch (error) {
      console.error('Error fetching all projects:', error);
      res.status(500).json({ error: 'Failed to fetch all projects' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
