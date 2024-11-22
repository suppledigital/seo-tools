// pages/api/trello-audit/fetch-cards.js
import pool from '../../../lib/db';
import axios from 'axios';

export default async function handler(req, res) {
  const { TRELLO_API_KEY, TRELLO_TOKEN, BOARD_ID } = process.env;

  try {
    // Fetch cards from Trello
    const cardsResponse = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}/cards`,
      {
        params: {
          key: TRELLO_API_KEY,
          token: TRELLO_TOKEN,
          members: true,
        },
      }
    );

    const cardsData = cardsResponse.data;

    for (const card of cardsData) {
      // Insert or update card
      await pool.execute(
        `INSERT INTO cards (trello_id, name, description, date_last_activity, created_date, due_date)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           date_last_activity = VALUES(date_last_activity),
           due_date = VALUES(due_date)`,
        [
          card.id,
          card.name,
          card.desc,
          new Date(card.dateLastActivity),
          new Date(parseInt(card.id.substring(0, 8), 16) * 1000),
          card.due ? new Date(card.due) : null,
        ]
      );

      // Get card_id
      const [cardRows] = await pool.execute(
        'SELECT card_id FROM cards WHERE trello_id = ?',
        [card.id]
      );
      const card_id = cardRows[0].card_id;

      // Insert members
      for (const memberId of card.idMembers) {
        // Fetch member details from Trello
        const memberResponse = await axios.get(
          `https://api.trello.com/1/members/${memberId}`,
          {
            params: {
              key: TRELLO_API_KEY,
              token: TRELLO_TOKEN,
            },
          }
        );

        const member = memberResponse.data;

        // Insert or update member
        await pool.execute(
          `INSERT INTO members (trello_id, full_name, username)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             full_name = VALUES(full_name),
             username = VALUES(username)`,
          [member.id, member.fullName, member.username]
        );

        // Get member_id
        const [memberRows] = await pool.execute(
          'SELECT member_id FROM members WHERE trello_id = ?',
          [member.id]
        );
        const member_id = memberRows[0].member_id;

        // Insert into card_members
        await pool.execute(
          `INSERT IGNORE INTO card_members (card_id, member_id) VALUES (?, ?)`,
          [card_id, member_id]
        );
      }
    }

    // Fetch updated cards from database
    const [updatedCards] = await pool.execute('SELECT * FROM cards');

    res.status(200).json({ cards: updatedCards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Error fetching cards' });
  }
}
