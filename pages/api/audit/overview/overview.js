// pages/api/audit/overview/overview.js
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export default async function handler(req, res) {
  const { domain } = req.query;
  const cacheKey = `overview-${domain}`;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    const apiKey = process.env.SERANKING_API_KEY;
    const source = 'au';
    const serankingBaseUrl = 'https://api4.seranking.com';

    const url = `${serankingBaseUrl}/research/${source}/overview/?domain=${encodeURIComponent(domain)}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    cache.set(cacheKey, response.data);

    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      console.error('Error fetching domain overview:', error.response?.data || error.message);
      res.status(500).json({ error: 'Error fetching domain overview' });
    }
  }
}