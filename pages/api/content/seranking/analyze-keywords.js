// pages/api/seranking/analyze-keywords.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { keyword, country } = req.body;

    try {
      const apiKey = process.env.SERANKING_API_KEY;
      const source = country.toLowerCase(); // Ensure country code is lowercase
      const url = `https://api4.seranking.com/research/${source}/analyze-keywords/`;

      const response = await axios.post(
        url,
        { keywords: [keyword] },
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error fetching keyword analysis:', error.response?.data || error);
      res.status(500).json({ message: 'Error fetching keyword analysis' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
