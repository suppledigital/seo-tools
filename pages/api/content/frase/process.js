// pages/api/content/frase/process.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { query } = req.body;
    const fraseToken = process.env.FRASE_API_TOKEN; // Add your Frase API key here

    try {
      const response = await axios.post(
        'https://api.frase.io/api/v1/process_serp',
        {
          query,
          lang: 'en',
          country: 'au',
          count: 20,
          include_full_text: false
        },
        { headers: { token: fraseToken } }
      );

      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error with Frase API:', error);
      res.status(500).json({ error: 'Error with Frase API' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}