// pages/api/webceo-keywords/fetchProject.js
import path from 'path';
import { fetchRankings } from '../../../utils/webceo';
import { createCsvFile } from '../../../utils/excel';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { projectId, projectName } = req.body;

    if (!projectId || !projectName) {
      return res.status(400).json({ error: 'Project ID and Name are required' });
    }

    try {
      const rankingsData = await fetchRankings(projectId, { history_depth: 1000 });
      const rankings = rankingsData.data?.ranking_data || [];
      if (!Array.isArray(rankings)) {
        throw new Error('Invalid data structure received from WebCEO API.');
      }

      // Normalize the project name by removing "www" if present
      const normalizedProjectName = projectName.replace(/^www\./, '').toLowerCase();

      const filesData = {}; // To group rankings by file name

      // Group rankings by file name combinations
      rankings.forEach((ranking) => {
        ranking.positions.forEach((position) => {
          // Extract the search engine domain from the 'description' field
          const description = position.description || '';
          let searchEngineDomain = '';
          if (description) {
            const [domainPart] = description.split(' - ');
            searchEngineDomain = domainPart ? domainPart.toLowerCase() : '';
          }
          if (!searchEngineDomain) {
            // Fallback to previous method if description is not available
            searchEngineDomain = `${(position.se || 'unknown')}.com`.toLowerCase();
          }

          const countryCode = position.country || 'XX';
          const language = position.language || 'XX';
          const location = position.location?.replace(/, /g, '-') || '';

          // Correctly handle the 'mobile' parameter
          let deviceType = ''; // Default to empty string for desktop
          if (position.mobile === 1) {
            deviceType = 'mobile';
          } else if (position.mobile === 2) {
            deviceType = 'tablet';
          }
          // For desktop, we leave deviceType as empty string

          const fileNameComponents = [
            normalizedProjectName,
            searchEngineDomain,
            countryCode,
            language,
            // Include deviceType only if it's 'mobile' or 'tablet'
            ...(deviceType ? [deviceType] : []),
            location,
          ];

          const fileName = fileNameComponents
            .filter(Boolean)
            .join('_') + '.csv';

          // Create a new object that includes only the data for this ranking and position
          const rankingData = {
            kw: ranking.kw,
            positions: [
              {
                ...position,
                scan_history: position.scan_history || [],
              },
            ],
          };

          if (!filesData[fileName]) {
            filesData[fileName] = [];
          }
          filesData[fileName].push(rankingData);
        });
      });

      const createdFiles = [];

      // Create CSV files for each grouped combination
      for (const [fileName, rankings] of Object.entries(filesData)) {
        const filePath = path.join(process.cwd(), 'public', 'excel', fileName);
        await createCsvFile({ rankings }, filePath);
        createdFiles.push(`/excel/${fileName}`);
      }

      res.status(200).json({
        message: `Project data fetched and CSV files created for "${normalizedProjectName}"`,
        files: createdFiles,
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
