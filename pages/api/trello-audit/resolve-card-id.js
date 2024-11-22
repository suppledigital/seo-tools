// pages/api/trello-audit/resolve-card-id.js
import axios from 'axios';

export default async function handler(req, res) {
  const { shortLink } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    const response = await axios.get(
      `https://api.trello.com/1/cards/${shortLink}`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
          fields: 'id',
        },
      }
    );

    const cardId = response.data.id;

    res.status(200).json({ cardId });
  } catch (error) {
    console.error('Error resolving card ID:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error resolving card ID' });
  }
}
