// pages/api/trello-audit/member-activities.js
import axios from 'axios';

export default async function handler(req, res) {
  const { memberId, page = 0 } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;
  const actionsPerPage = 30;
  const before = req.query.before; // For pagination using 'before' parameter

  try {
    const params = {
      key: TRELLO_API_KEY,
      token: TRELLO_TOKEN,
      limit: actionsPerPage,
      fields: 'data,date,type',
      memberCreator: true,
      memberCreator_fields: 'fullName,initials',
      page,
    };
    if (before) {
      params.before = before;
    }

    const response = await axios.get(`https://api.trello.com/1/members/${memberId}/actions`, {
      params,
    });

    const activities = response.data;

    res.status(200).json({ activities });
  } catch (error) {
    console.error('Error fetching member activities:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching member activities' });
  }
}
