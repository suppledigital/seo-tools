// pages/api/content/entries/logs.js

import { getLogs } from '../../../../lib/logs'; // Adjust the relative path as needed

export default function handler(req, res) {
  const { entry_id } = req.query;
  if (!entry_id) {
    return res.status(400).json({ error: 'entry_id is required' });
  }

  const logs = getLogs(entry_id);
  return res.status(200).json({ logs });
}
