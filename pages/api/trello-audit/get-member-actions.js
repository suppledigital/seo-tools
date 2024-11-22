// pages/api/trello-audit/get-member-actions.js
import axios from 'axios';

export default async function handler(req, res) {
  const { memberId, cardIds } = req.query;
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  try {
    const cardIdList = cardIds.split(',');

    let allActions = [];

    for (const cardId of cardIdList) {
      const response = await axios.get(
        `https://api.trello.com/1/cards/${cardId}/actions`,
        {
          params: {
            key: TRELLO_API_KEY,
            token: TRELLO_TOKEN,
            filter: 'all',
            fields: 'id,type,date,data,idMemberCreator',
            memberCreator: true,
            memberCreator_fields: 'fullName,initials',
          },
        }
      );

      const actions = response.data;

      // Filter actions by memberId
      const memberActions = actions.filter(action => action.idMemberCreator === memberId);

      allActions = allActions.concat(memberActions);
    }

    res.status(200).json({ actions: allActions });
  } catch (error) {
    console.error('Error fetching member actions:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching member actions' });
  }
}
