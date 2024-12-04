// pages/api/webceo-keywords/downloadZipAll.js
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const directoryPath = path.join(process.cwd(), 'public', 'excel');
      const files = fs.readdirSync(directoryPath);

      const zip = archiver('zip', { zlib: { level: 9 } });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=all_projects.zip');

      zip.pipe(res);

      files.forEach((file) => {
        const filePath = path.join(directoryPath, file);
        zip.file(filePath, { name: file });
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
