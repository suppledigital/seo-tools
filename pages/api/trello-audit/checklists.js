// pages/api/trello-audit/checklists.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    // Fetch checklists for the card
    const checklistsResponse = await axios.get(
      `https://api.trello.com/1/cards/${cardId}/checklists`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
        },
      }
    );

    const checklistsData = checklistsResponse.data;

    res.status(200).json({ checklists: checklistsData });
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ error: 'Error fetching checklists' });
  }
}
