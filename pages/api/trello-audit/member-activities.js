// pages/api/trello-audit/member-activities.js
import axios from 'axios';

export default async function handler(req, res) {
  const { memberId, cardId, page = 0 } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;
  const actionsPerPage = 30;
  const before = req.query.before; // For pagination using 'before' parameter

  if (!memberId && !cardId) {
    return res.status(400).json({ error: 'Either memberId or cardId is required' });
  }

  try {
    let url = '';
    let params = {
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

    if (cardId) {
      // Fetch actions for the card
      url = `https://api.trello.com/1/cards/${cardId}/actions`;
    } else if (memberId) {
      // Fetch actions for the member
      url = `https://api.trello.com/1/members/${memberId}/actions`;
    }

    const response = await axios.get(url, { params });

    let activities = response.data;

    // If both memberId and cardId are provided, filter activities by member
    if (memberId && cardId) {
      activities = activities.filter(
        (action) => action.memberCreator && action.memberCreator.id === memberId
      );
    }

    res.status(200).json({ activities });
  } catch (error) {
    console.error('Error fetching member activities:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching member activities' });
  }
}
