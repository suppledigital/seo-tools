import axios from 'axios';

export default async function handler(req, res) {
  const { auditId } = req.query;

  try {
    const apiKey = process.env.SERANKING_API_KEY;
    const response = await axios.get(`https://api4.seranking.com/audit/${auditId}`, {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching audit status:', error);
    res.status(500).json({ message: 'Error fetching audit status' });
  }
}
