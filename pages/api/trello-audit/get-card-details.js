// pages/api/trello-audit/get-card-details.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  if (!cardId) {
    return res.status(400).json({ error: 'cardId is required' });
  }

  try {
    const params = {
      key: TRELLO_API_KEY,
      token: TRELLO_TOKEN,
      fields: 'name,shortLink,idBoard,idList',
      board_fields: 'name',
      list_fields: 'name',
    };

    const response = await axios.get(`https://api.trello.com/1/cards/${cardId}`, {
      params,
    });

    const cardDetails = response.data;

    // Fetch list details
    const listRes = await axios.get(`https://api.trello.com/1/lists/${cardDetails.idList}`, {
      params,
    });
    const listDetails = listRes.data;

    // Fetch board details
    const boardRes = await axios.get(`https://api.trello.com/1/boards/${cardDetails.idBoard}`, {
      params,
    });
    const boardDetails = boardRes.data;

    res.status(200).json({
      name: cardDetails.name,
      shortLink: cardDetails.shortLink,
      board: {
        name: boardDetails.name,
      },
      list: {
        name: listDetails.name,
      },
    });
  } catch (error) {
    console.error('Error fetching card details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching card details' });
  }
}
