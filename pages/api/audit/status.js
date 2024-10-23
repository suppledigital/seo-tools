import axios from 'axios';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const apiKey = process.env.SERANKING_API_KEY;

    const response = await axios.get(`https://api4.seranking.com/audit/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
    },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching audit status:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch audit status' });
  }
}
