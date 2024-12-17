// pages/api/content/entries/bulk-modify.js

import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { entry_ids, field, value } = req.body;

    if (!entry_ids || !field) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
      if (field === 'additional_info') {
        const additionalInfoKey = Object.keys(value)[0];
        const additionalInfoData = value[additionalInfoKey];

        // Fields that typically deal with lists of keywords
        const listFields = ['lsi_terms', 'paa_terms', 'topic_cluster'];

        if (listFields.includes(additionalInfoKey)) {
          // Expecting something like: { suggestions: [...], overrideExisting: true/false }
          const { suggestions, overrideExisting } = additionalInfoData;

          if (!Array.isArray(suggestions) || typeof overrideExisting === 'undefined') {
            throw new Error(`Invalid payload structure for ${additionalInfoKey}`);
          }

          for (const entry_id of entry_ids) {
            const [rows] = await pool.query(
              'SELECT ?? FROM entries WHERE entry_id = ?',
              [additionalInfoKey, entry_id]
            );

            let existingValue = rows[0] ? rows[0][additionalInfoKey] : '';
            let existingKeywords = existingValue ? existingValue.split(', ').map(s => s.trim()).filter(Boolean) : [];

            // Since suggestions is now an array of strings, not objects
            let newKeywords = suggestions;

            let updatedKeywords;
            if (!overrideExisting && existingKeywords.length > 0) {
              updatedKeywords = [...existingKeywords, ...newKeywords];
            } else {
              updatedKeywords = newKeywords;
            }

            // Remove duplicates
            updatedKeywords = Array.from(new Set(updatedKeywords));
            // Join keywords into a comma-separated string
            let newValue = updatedKeywords.join(', ');

            await pool.query(
              'UPDATE entries SET ?? = ? WHERE entry_id = ?',
              [additionalInfoKey, newValue, entry_id]
            );
          }
        } else {
          // For simple fields like word_count, existing_content, etc.
          // additionalInfoData is just a string or a simple value
          for (const entry_id of entry_ids) {
            await pool.query(
              'UPDATE entries SET ?? = ? WHERE entry_id = ?',
              [additionalInfoKey, additionalInfoData, entry_id]
            );
          }
        }
      } else {
        // For page_type, content_type, or other direct fields
        const entryIdsPlaceholders = entry_ids.map(() => '?').join(', ');
        let sql = `UPDATE entries SET ${field} = ? WHERE entry_id IN (${entryIdsPlaceholders})`;
        let params = [value, ...entry_ids];
        await pool.query(sql, params);
      }

      res.status(200).json({ message: 'Entries updated successfully' });
    } catch (error) {
      console.error('Error updating entries:', error);
      res.status(500).json({ error: 'Error updating entries' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
