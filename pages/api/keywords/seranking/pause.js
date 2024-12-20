// pages/api/keywords/seranking/pause.js
import { updateImportStatus, getImportStatus } from '../../../../lib/dbHelpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { statusId, pause } = req.body;
  if (!statusId || typeof pause === 'undefined') {
    return res.status(400).json({ message: 'Missing statusId or pause parameter' });
  }

  // Update is_paused in the database
  await updateImportStatus({ is_paused: pause ? 1 : 0 }, statusId);

  const status = await getImportStatus(statusId);
  if (pause) {
    res.status(200).json({ message: 'Import paused.', status });
  } else {
    res.status(200).json({ message: 'Import resumed.', status });
  }
}
