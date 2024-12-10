// pages/api/content/train/training-data.js

import db from '../../../../lib/db'; // Ensure the correct path to your db.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const [trainingData] = await db.query('SELECT id, input_text, output_text, label, keywords, created_at FROM training_data ORDER BY created_at DESC');
    return res.status(200).json({ trainingData });
  } catch (error) {
    console.error('Error fetching training data:', error);
    return res.status(500).json({ error: 'Failed to fetch training data.' });
  }
}
