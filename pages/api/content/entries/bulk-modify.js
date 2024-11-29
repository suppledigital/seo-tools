// pages/api/content/entries/bulk-modify.js

import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { entry_ids, field, value } = req.body;

    if (!entry_ids || !field) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
      let sql = '';
      let params = [];

      // Prepare placeholders for entry_ids
      const entryIdsPlaceholders = entry_ids.map(() => '?').join(', ');

      if (field === 'additional_info') {
        // Handle additional info updates
        // 'value' is an object like { word_count: '500' }
        const updateFields = Object.keys(value)
          .map((key) => `${key} = ?`)
          .join(', ');
        params = [...Object.values(value), ...entry_ids];
        sql = `UPDATE entries SET ${updateFields} WHERE entry_id IN (${entryIdsPlaceholders})`;
      } else {
        sql = `UPDATE entries SET ${field} = ? WHERE entry_id IN (${entryIdsPlaceholders})`;
        params = [value, ...entry_ids];
      }

      await pool.query(sql, params);

      res.status(200).json({ message: 'Entries updated successfully' });
    } catch (error) {
      console.error('Error updating entries:', error);
      res.status(500).json({ error: 'Error updating entries' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
