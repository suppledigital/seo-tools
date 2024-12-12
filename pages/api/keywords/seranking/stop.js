// pages/api/keywords/seranking/stop.js
import { updateImportStatus, getImportStatus } from '../../../../lib/dbHelpers';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { statusId } = req.body;

  if (!statusId) {
    return res.status(400).json({ message: 'statusId is required' });
  }

  const current = await getImportStatus(statusId);
  if (!current.id) {
    return res.status(404).json({ message: 'No ongoing import with that statusId' });
  }

  await updateImportStatus({ is_stopped: 1 }, statusId);
  res.status(200).json({ message: 'Import stopped' });
}
