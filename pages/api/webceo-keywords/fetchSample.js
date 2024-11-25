// pages/api/webceo-keywords/fetchSample.js
import { fetchProjects } from '../../../utils/webceo';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const projectsData = await fetchProjects();
      if (projectsData && projectsData.data && projectsData.data.length > 0) {
        const sampleProject = projectsData.data[0];
        // Determine columns based on sampleProject
        const columns = Object.keys(sampleProject);
        res.status(200).json({
          columns,
        });
      } else {
        res.status(404).json({ error: 'No projects found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sample columns' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
