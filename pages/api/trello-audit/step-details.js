// pages/api/trello-audit/step-details.js
import axios from 'axios';

export default async function handler(req, res) {
  const { actionId } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    // Fetch action details
    const actionResponse = await axios.get(
      `https://api.trello.com/1/actions/${actionId}`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
          fields: 'data,date,type',
        },
      }
    );

    const actionData = actionResponse.data;

    res.status(200).json({ details: actionData });
  } catch (error) {
    console.error('Error fetching step details:', error);
    res.status(500).json({ error: 'Error fetching step details' });
  }
}
