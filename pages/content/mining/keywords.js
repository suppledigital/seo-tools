// pages/api/mining/keywords.js
/*import { promises as fs } from 'fs';
import path from 'path';

const keywordsFilePath = path.resolve('./data/keywords.json');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(keywordsFilePath, 'utf8');
      const keywords = JSON.parse(data);
      res.status(200).json(keywords);
    } catch (error) {
      console.error('Error reading keywords file:', error);
      res.status(500).json({ error: 'Failed to load keywords' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
*/