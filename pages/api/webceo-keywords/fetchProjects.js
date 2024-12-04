// pages/api/webceo-keywords/fetchProjects.js
/*import { fetchProjects } from '../../../utils/webceo';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
     // const filters = {}; // Add any necessary filters here, e.g., user, suspended
      // Example filter for active projects only:
       const filters = { suspended: 1 };
      const projectsData = await fetchProjects(filters);
      if (projectsData && projectsData.data) {
        res.status(200).json({ projects: projectsData.data });
      } else {
        res.status(404).json({ error: 'No projects found' });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
*/
// pages/api/webceo-keywords/fetchProjects.js
import { fetchProjects } from '../../../utils/webceo';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { suspended } = req.query;
      const filters = {};
      if (suspended !== undefined) {
        filters.suspended = parseInt(suspended, 10); // Convert to integer
      }
      const projectsData = await fetchProjects(filters);
      if (projectsData && projectsData.data) {
        res.status(200).json({ projects: projectsData.data });
      } else {
        res.status(404).json({ error: 'No projects found' });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
