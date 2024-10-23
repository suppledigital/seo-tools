import axios from 'axios';

export default async function handler(req, res) {
  const { auditId } = req.query;

  if (req.method === 'GET') {
    try {
      const apiKey = process.env.SERANKING_API_KEY;
      const response = await axios.get(
        `https://api4.seranking.com/audit/${auditId}/report`,
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.is_finished) {
        res.status(200).json(response.data);
      } else {
        res.status(202).json({ message: 'Audit not finished yet' });
      }
    } catch (error) {
      console.error('Error fetching audit report:', error);
      res.status(500).json({ message: 'Error fetching audit report' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
