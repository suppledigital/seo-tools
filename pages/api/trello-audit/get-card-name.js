// pages/api/trello-audit/get-card-name.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    const response = await axios.get(
      `https://api.trello.com/1/cards/${cardId}`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
          fields: 'name',
        },
      }
    );

    const card = response.data;

    res.status(200).json({ name: card.name });
  } catch (error) {
    console.error('Error fetching card name:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching card name' });
  }
}
