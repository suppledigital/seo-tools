// pages/api/trello-audit/card-activities.js
import axios from 'axios';

export default async function handler(req, res) {
  const { cardId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    const actionsResponse = await axios.get(
      `https://api.trello.com/1/cards/${cardId}/actions`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
          filter: 'all',
          fields: 'id,type,date,data,memberCreator',
          memberCreator_fields: 'fullName,initials',
        },
      }
    );

    const actionsData = actionsResponse.data;

    res.status(200).json({ activities: actionsData });
  } catch (error) {
    console.error('Error fetching card activities:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching card activities' });
  }
}
