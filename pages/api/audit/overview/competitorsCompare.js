// pages/api/audit/overview/competitorsCompare.js
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export default async function handler(req, res) {
  const { domain, compare, type = 'adv', page = 1, limit = 100 } = req.query;
  const cacheKey = `competitorsCompare-${domain}-${compare}-${type}-page${page}-limit${limit}`;

  if (!domain || !compare) {
    return res.status(400).json({ error: 'Domain and compare domain are required' });
  }

  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    const serankingApiKey = process.env.SERANKING_API_KEY;
    const source = 'au';
    const serankingBaseUrl = 'https://api4.seranking.com';

    const url = `${serankingBaseUrl}/research/${source}/competitors/compare?domain=${encodeURIComponent(
      domain
    )}&compare=${encodeURIComponent(compare)}&type=${type}&page=${page}&limit=${limit}`;

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
      console.error('Error fetching competitors comparison:', error.response?.data || error.message);
      res.status(500).json({ error: 'Error fetching competitors comparison' });
    }
  }
}
