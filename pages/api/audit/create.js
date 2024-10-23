import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { domain } = req.body;

    try {
      const apiKey = process.env.SERANKING_API_KEY;
      const response = await axios.post(
        'https://api4.seranking.com/audit/create',
        { domain },
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error creating audit:', error);
      res.status(500).json({ message: 'Error creating audit' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
