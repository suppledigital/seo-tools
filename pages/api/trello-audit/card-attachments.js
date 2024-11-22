// pages/api/trello-audit/card-attachments.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    const response = await axios.get(
      `https://api.trello.com/1/cards/${cardId}/attachments`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
          fields: 'url',
        },
      }
    );

    const attachments = response.data;

    res.status(200).json({ attachments });
  } catch (error) {
    console.error('Error fetching card attachments:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching card attachments' });
  }
}
