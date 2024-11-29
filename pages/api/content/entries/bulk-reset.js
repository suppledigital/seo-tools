// pages/api/content/entries/bulk-reset.js

import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { entry_ids, field } = req.body;

    if (!entry_ids || !field) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
      let sql = '';
      let params = [];

      if (field === 'additional_info') {
        sql = `UPDATE entries SET word_count = NULL, lsi_terms = NULL, paa_terms = NULL, topic_cluster = NULL, existing_content = NULL, existing_product_info = NULL, brand_terms = NULL WHERE entry_id IN (?)`;
        params = [entry_ids];
      } else {
        sql = `UPDATE entries SET ${field} = NULL WHERE entry_id IN (?)`;
        params = [entry_ids];
      }

      await pool.query(sql, params);

      res.status(200).json({ message: 'Entries reset successfully' });
    } catch (error) {
      console.error('Error resetting entries:', error);
      res.status(500).json({ error: 'Error resetting entries' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
