// pages/api/trello-audit/card-attachments.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  if (!cardId) {
    return res.status(400).json({ error: 'cardId is required' });
  }

  try {
    const response = await axios.get(`https://api.trello.com/1/cards/${cardId}/attachments`, {
      params: {
        key: TRELLO_API_KEY,
        token: TRELLO_TOKEN,
        fields: 'url',
      },
    });

    res.status(200).json({ attachments: response.data });
  } catch (error) {
    console.error('Error fetching card attachments:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching card attachments' });
  }
}
