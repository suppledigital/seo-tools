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
        // Handle additional info updates
        // 'value' is an object like { lsi_terms: { suggestions: [...], overrideExisting: true } }
        // or { word_count: "750" }

        const additionalInfoKey = Object.keys(value)[0];
        const additionalInfoData = value[additionalInfoKey];

        // Define which fields require complex handling
        const listFields = ['lsi_terms', 'paa_terms', 'topic_cluster'];

        if (listFields.includes(additionalInfoKey)) {
          // Handle fields with suggestions and overrideExisting
          const { suggestions, overrideExisting } = additionalInfoData;

          if (!suggestions || typeof overrideExisting === 'undefined') {
            throw new Error(`Invalid payload structure for ${additionalInfoKey}`);
          }

          for (const entry_id of entry_ids) {
            // Fetch existing value
            const [rows] = await pool.query(
              'SELECT ?? FROM entries WHERE entry_id = ?',
              [additionalInfoKey, entry_id]
            );

            let existingValue = rows[0] ? rows[0][additionalInfoKey] : '';
            let existingKeywords = existingValue ? existingValue.split(', ') : [];
            let newKeywords = suggestions.map((sugg) => sugg.keyword);

            let updatedKeywords;

            if (!overrideExisting && existingValue) {
              // Append to existing value
              updatedKeywords = [...existingKeywords, ...newKeywords];
            } else {
              // Override existing value
              updatedKeywords = newKeywords;
            }

            // Remove duplicates
            updatedKeywords = Array.from(new Set(updatedKeywords));

            // Join keywords into a comma-separated string
            let newValue = updatedKeywords.join(', ');

            // Update the entry
            await pool.query(
              'UPDATE entries SET ?? = ? WHERE entry_id = ?',
              [additionalInfoKey, newValue, entry_id]
            );
          }
        } else {
          // Handle simple key-value fields like word_count, existing_content, etc.
          for (const entry_id of entry_ids) {
            await pool.query(
              'UPDATE entries SET ?? = ? WHERE entry_id = ?',
              [additionalInfoKey, additionalInfoData, entry_id]
            );
          }
        }
      } else {
        // For other fields, we can update directly
        // Prepare placeholders for entry_ids
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
