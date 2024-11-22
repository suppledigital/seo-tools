// pages/api/trello-audit/get-card-details.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    // Fetch card details including idList
    const cardResponse = await axios.get(`https://api.trello.com/1/cards/${cardId}`, {
      params: {
        key: TRELLO_API_KEY,
        token: TRELLO_TOKEN,
        fields: 'name,shortLink,idList',
        board: true,
        board_fields: 'name',
      },
    });

    const card = cardResponse.data;

    // Fetch list details using idList
    const listResponse = await axios.get(`https://api.trello.com/1/lists/${card.idList}`, {
      params: {
        key: TRELLO_API_KEY,
        token: TRELLO_TOKEN,
        fields: 'name',
      },
    });

    const list = listResponse.data;

    res.status(200).json({
      name: card.name,
      board: {
        id: card.board.id,
        name: card.board.name,
      },
      shortLink: card.shortLink,
      list: {
        id: list.id,
        name: list.name,
      },
    });
  } catch (error) {
    console.error('Error fetching card details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching card details' });
  }
}
