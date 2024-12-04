// pages/api/webceo-keywords/deleteAllExcel.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const directoryPath = path.join(process.cwd(), 'public', 'excel');

      if (fs.existsSync(directoryPath)) {
        const files = fs.readdirSync(directoryPath);
        files.forEach((file) => {
          fs.unlinkSync(path.join(directoryPath, file));
        });
        res.status(200).json({ message: 'All files deleted successfully.' });
      } else {
        res.status(404).json({ error: 'Directory does not exist.' });
      }
    } catch (error) {
      console.error('Error deleting all Excel files:', error);
      res.status(500).json({ error: 'Failed to delete all files.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed.' });
  }
}
