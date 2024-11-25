// pages/api/webceo-keywords/listExcelFiles.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const excelDir = path.join(process.cwd(), 'public', 'excel');

      // Check if the directory exists
      if (!fs.existsSync(excelDir)) {
        return res.status(200).json({ files: [] });
      }

      const files = fs.readdirSync(excelDir).filter((file) => file.endsWith('.xlsx'));
      res.status(200).json({ files });
    } catch (error) {
      console.error('Error listing Excel files:', error);
      res.status(500).json({ error: 'Failed to list Excel files' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
