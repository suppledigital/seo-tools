// pages/api/audit/overview/research.js
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export default async function handler(req, res) {
  const { domain, competitors, source = 'au', type = 'organic' } = req.query;

  if (!domain || !competitors) {
    return res.status(400).json({ error: 'Domain and competitors are required' });
  }

  const competitorsArray = Array.isArray(competitors) ? competitors : [competitors];

  const cacheKey = `research-${domain}-${competitorsArray.join('-')}`;

  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    const apiKey = process.env.SERANKING_API_KEY;
    const serankingBaseUrl = 'https://api4.seranking.com';

    const data = {};

    for (const competitor of competitorsArray) {
      const url = `${serankingBaseUrl}/research/${source}/competitors/compare?domain=${encodeURIComponent(domain)}&compare=${encodeURIComponent(competitor)}&type=${type}&limit=1000`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      data[competitor] = response.data;

      // To prevent hitting rate limits
      await wait(500);
    }

    cache.set(cacheKey, data);

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching research data:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching research data' });
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
