// pages/api/audit/overview/organicKeywords.js
import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

export default async function handler(req, res) {
  const { domain, page = 1, limit = 100, order_field = "traffic_percent" } = req.query;
  const cacheKey = `organicKeywords-${domain}-page${page}-limit${limit}-order_field${order_field}`;

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

    const url = `${serankingBaseUrl}/research/${source}/keywords/?domain=${encodeURIComponent(
      domain
    )}&type=organic&order_field=position&order_type=desc&page=${page}&limit=${limit}&order_field=${order_field}`;

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
      console.error('Error fetching organic keywords:', error.response?.data || error.message);
      res.status(500).json({ error: 'Error fetching organic keywords' });
    }
  }
}
