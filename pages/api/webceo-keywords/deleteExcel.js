// pages/api/webceo-keywords/deleteExcel.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    try {
      const filePath = path.join(process.cwd(), 'public', 'excel', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      fs.unlinkSync(filePath);
      console.log(`Excel file "${fileName}" deleted successfully.`);
      res.status(200).json({ message: `File "${fileName}" deleted successfully.` });
    } catch (error) {
      console.error('Error deleting Excel file:', error);
      res.status(500).json({ error: 'Failed to delete Excel file' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
