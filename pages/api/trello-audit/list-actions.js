// pages/api/trello-audit/list-actions.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId, listName, since } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  if (!listName) {
    return res.status(400).json({ error: 'listName parameter is required.' });
  }

  try {
    console.log('Fetching list actions with:', { cardId, listName, since });

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
          since: encodeURIComponent(since), // Ensure correct encoding
        },
      }
    );

    const actionsData = actionsResponse.data;

    console.log('Retrieved actions:', actionsData);

    // Filter actions that involve the specified listName either before or after
    const filteredActions = actionsData.filter((action) => {
      const listNames = [
        action.data?.list?.name,
        action.data?.listAfter?.name,
        action.data?.listBefore?.name,
      ];
      return listNames.includes(listName);
    });

    console.log('Filtered actions:', filteredActions);

    res.status(200).json({ actions: filteredActions });
  } catch (error) {
    console.error('Error fetching list actions:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching list actions' });
  }
}
