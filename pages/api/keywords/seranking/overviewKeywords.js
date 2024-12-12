// pages/api/keywords/seranking/overviewKeywords.js
import { getAllKeywordsWithDetails } from '../../../../lib/dbHelpers'; // Make a helper to JOIN keywords, main_projects, search_engines

export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  
    try {
      const keywords = await getAllKeywordsWithDetails();
      res.status(200).json({ keywords });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }