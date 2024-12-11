// pages/api/content/semrush/organic-results.js

import { getOrganicResults } from '../../../../lib/semrush';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { keyword, country, yearMonth } = req.body;

    try {
      const organicResults = await getOrganicResults(keyword, country, yearMonth);
      console.log(organicResults); // Optional: Log the results for debugging

      res.status(200).json(organicResults);
    } catch (error) {
      console.error('Error in SEMRush organic-results handler:', error.message);
      res.status(500).json({ message: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
