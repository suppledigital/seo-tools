const express = require('express');
const pool = require('../db'); // Adjust this to your database configuration file
const router = express.Router();

// POST /server-api/entries/:entryId/save-classification
router.post('/:entryId/save-classification', async (req, res) => {
  const { entryId } = req.params;
  const { page_type, content_type } = req.body;

  try {
    const updates = {};
    if (page_type !== undefined) updates.page_type = page_type;
    if (content_type !== undefined) updates.content_type = content_type;

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await pool.query(
      `UPDATE entries SET ${setClause} WHERE entry_id = ?`,
      [...values, entryId]
    );
    res.status(200).json({ message: 'Classification saved successfully' });
  } catch (error) {
    console.error('Error saving classification:', error);
    res.status(500).json({ message: 'Error saving classification' });
  }
});

// POST /server-api/entries/:entryId/save-info
router.post('/:entryId/save-info', async (req, res) => {
  const { entryId } = req.params;
  const { info_type, info_value } = req.body;

  try {
    const allowedInfoTypes = [
      'word_count',
      'lsi_terms',
      'paa_terms',
      'topic_cluster',
      'existing_content',
      'existing_product_info',
      'brand_terms',
    ];

    if (!allowedInfoTypes.includes(info_type)) {
      return res.status(400).json({ message: 'Invalid info type' });
    }

    await pool.query(
      `UPDATE entries SET ${info_type} = ? WHERE entry_id = ?`,
      [info_value, entryId]
    );
    res.status(200).json({ message: 'Information saved successfully' });
  } catch (error) {
    console.error('Error saving information:', error);
    res.status(500).json({ message: 'Error saving information' });
  }
});

module.exports = router;
