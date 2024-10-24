// pages/api/audit/overview/competitors.js
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export default async function handler(req, res) {
  const { domain, type = 'organic', stats = 1 } = req.query;
  const cacheKey = `competitors-${domain}-${type}-stats${stats}`;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    const serankingApiKey = process.env.SERANKING_API_KEY;
    const source = 'au';
    const serankingBaseUrl = 'https://api4.seranking.com';

    const url = `${serankingBaseUrl}/research/${source}/competitors?domain=${encodeURIComponent(
      domain
    )}&type=${type}&stats=${stats}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${serankingApiKey}`,
      },
    });

    cache.set(cacheKey, response.data);

    res.status(200).json(response.data);
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      console.error('Error fetching competitors:', error.response?.data || error.message);
      res.status(500).json({ error: 'Error fetching competitors' });
    }
  }
}
