// pages/api/webceo-keywords/downloadZip.js
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { fileNames } = req.body;

    if (!fileNames || !Array.isArray(fileNames)) {
      return res.status(400).json({ error: 'fileNames array is required' });
    }

    try {
      const zip = archiver('zip', { zlib: { level: 9 } });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=selected_projects.zip');

      zip.pipe(res);

      fileNames.forEach((fileName) => {
        const filePath = path.join(process.cwd(), 'public', 'excel', fileName);
        if (fs.existsSync(filePath)) {
          zip.file(filePath, { name: fileName });
        }
      });

      await zip.finalize();
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      res.status(500).json({ error: 'Failed to create ZIP file' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
