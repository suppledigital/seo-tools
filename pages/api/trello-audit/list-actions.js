// pages/api/trello-audit/list-actions.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId, listName, since } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    const actionsResponse = await axios.get(
      `https://api.trello.com/1/cards/${cardId}/actions`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
          filter: 'all',
          fields: 'id,type,date,data',
          memberCreator: true,
          memberCreator_fields: 'fullName',
          since,
        },
      }
    );

    const actionsData = actionsResponse.data;

    // Filter actions that happened in the specified list
    const filteredActions = actionsData.filter((action) => {
      const listNames = [
        action.data.list?.name,
        action.data.listAfter?.name,
        action.data.listBefore?.name,
      ];
      return listNames.includes(listName);
    });

    res.status(200).json({ actions: filteredActions });
  } catch (error) {
    console.error('Error fetching list actions:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching list actions' });
  }
}
