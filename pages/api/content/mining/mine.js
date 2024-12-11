// pages/api/mining/mine.js

import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import { getOrganicResults } from '../../../lib/semrush'; // Adjust the path as needed

const keywordsFilePath = path.resolve('./data/keywords.json');
const txtFolderPath = path.resolve('./public/txt');

// Ensure the txt directory exists
fs.mkdir(txtFolderPath, { recursive: true }).catch((err) => {
  console.error('Error creating txt folder:', err);
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { keyword, country, yearMonth } = req.body;

    if (!keyword || !country) {
      return res.status(400).json({ error: 'Keyword and country are required.' });
    }

    try {
      // Load existing keywords
      let keywords = [];
      try {
        const data = await fs.readFile(keywordsFilePath, 'utf8');
        keywords = JSON.parse(data);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error('Error reading keywords file:', error);
          return res.status(500).json({ error: 'Failed to read keywords data.' });
        }
        // If file doesn't exist, start with an empty array
      }

      // Create a new keyword entry
      const newKeyword = {
        id: Date.now(),
        keyword,
        country,
        yearMonth: yearMonth || null,
        createdAt: new Date().toISOString(),
        status: 'processing',
        fileName: `${Date.now()}-${keyword.replace(/\s+/g, '_')}.txt`,
      };

      keywords.push(newKeyword);

      // Save the updated keywords list
      try {
        await fs.writeFile(keywordsFilePath, JSON.stringify(keywords, null, 2));
      } catch (error) {
        console.error('Error writing keywords file:', error);
        return res.status(500).json({ error: 'Failed to save keyword.' });
      }

      // Start the mining process asynchronously
      mineKeyword(newKeyword, country, yearMonth);

      return res.status(200).json({ message: 'Mining started', keyword: newKeyword });
    } catch (error) {
      console.error('Error in mining handler:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * Function to perform the mining process.
 *
 * @param {Object} keywordObj - The keyword object containing details.
 * @param {string} country - The country code.
 * @param {string} [yearMonth] - The year and month in 'YYYYMM' format.
 */
async function mineKeyword(keywordObj, country, yearMonth) {
  try {
    // Fetch organic results using SEMRush
    const organicResults = await getOrganicResults(keywordObj.keyword, country, yearMonth);

    if (!organicResults || organicResults.length === 0) {
      throw new Error('No organic results found.');
    }

    let aggregatedContent = '';

    for (const result of organicResults) {
      const url = result.Ur; // Adjust the key based on SEMRush response
      try {
        const response = await axios.get(url, { timeout: 10000 }); // 10 seconds timeout
        // Simple content extraction: stripping HTML tags
        const text = response.data.replace(/<[^>]+>/g, ' ');
        aggregatedContent += `\n\nURL: ${url}\n\n${text}`;
      } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
      }
    }

    // Save the aggregated content to a txt file
    const filePath = path.join(txtFolderPath, keywordObj.fileName);
    await fs.writeFile(filePath, aggregatedContent, 'utf8');

    // Update the keyword status to 'completed'
    await updateKeywordStatus(keywordObj.id, 'completed');
  } catch (error) {
    console.error('Error in mineKeyword:', error.message);
    // Update the keyword status to 'failed'
    await updateKeywordStatus(keywordObj.id, 'failed');
  }
}

/**
 * Updates the status of a keyword in the keywords.json file.
 *
 * @param {number} id - The unique identifier of the keyword.
 * @param {string} status - The new status ('completed' or 'failed').
 */
async function updateKeywordStatus(id, status) {
  try {
    const data = await fs.readFile(keywordsFilePath, 'utf8');
    let keywords = JSON.parse(data);

    keywords = keywords.map((k) =>
      k.id === id ? { ...k, status } : k
    );

    await fs.writeFile(keywordsFilePath, JSON.stringify(keywords, null, 2));
  } catch (error) {
    console.error('Error updating keyword status:', error);
  }
}
