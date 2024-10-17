// pages/api/entries/save-info.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import pool from '../../../server/db';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { entry_id, info_type, info_value } = req.body;

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
        [info_value, entry_id]
      );

      res.status(200).json({ message: 'Information saved successfully' });
    } catch (error) {
      console.error('Error saving information:', error);
      res.status(500).json({ message: 'Error saving information' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
