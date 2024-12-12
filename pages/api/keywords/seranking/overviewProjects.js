// pages/api/keywords/seranking/overviewProjects.js
import { getProjects } from '../../../../lib/dbHelpers'; // Make a helper that SELECT * FROM main_projects


export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  
    try {
      const projects = await getProjects();
      res.status(200).json({ projects });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }