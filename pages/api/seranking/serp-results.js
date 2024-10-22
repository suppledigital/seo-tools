// pages/api/seranking/serp-results.js

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { keyword, country } = req.body;

    try {
      const apiKey = process.env.SERANKING_API_KEY;

      // First, get the engine_id for the specified country
      const enginesResponse = await axios.get(
        'https://api4.seranking.com/system/search-engines',
        {
          headers: {
            Authorization: `Token ${apiKey}`,
          },
        }
      );

      const engines = enginesResponse.data;

      // Map country codes to country names
      const countryCodeToName = {
        AU: 'Australia',
        US: 'USA',
        UK: 'United Kingdom',
        NZ: 'New Zealand',
        // Add more mappings as needed
      };

      const countryName = countryCodeToName[country.toUpperCase()];

      if (!countryName) {
        console.error('Invalid country code:', country);
        return res.status(400).json({ message: 'Invalid country code' });
      }

      // Find all engines for Google in the specified country
      const matchingEngines = engines.filter(
        (e) => e.name.toLowerCase() === `google ${countryName.toLowerCase()}`
      );

      if (!matchingEngines || matchingEngines.length === 0) {
        console.error('No matching engines found for:', countryName);
        return res.status(400).json({ message: 'Invalid country or engine not found' });
      }

      // Pick any one engine (e.g., the first one)
      const engine = matchingEngines[0];
      const engine_id = engine.id;

      // Add the keyword to the queue
      const taskResponse = await axios.post(
        'https://api4.seranking.com/parsing/serp/tasks',
        {
          query: keyword,
          engine_id,
        },
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Engine ID:', engine_id);
      console.log('Keyword:', keyword);
      console.log('Task Response Data:', taskResponse.data);

      const taskId = taskResponse.data[0]?.task_id || taskResponse.data.task_id;

      if (!taskId) {
        console.error('Failed to retrieve task ID from response:', taskResponse.data);
        return res.status(500).json({ message: 'Failed to add task' });
      }

      // Poll for results
      let attempts = 0;
      const maxAttempts = 20;
      const delay = 5000; // 10 seconds

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        const resultResponse = await axios.get(
          `https://api4.seranking.com/parsing/serp/tasks/${taskId}`,
          {
            headers: {
              Authorization: `Token ${apiKey}`,
            },
          }
        );

        console.log(`Attempt ${attempts + 1}:`, resultResponse.data);

        if (resultResponse.data.status === 'processing') {
          attempts++;
          continue;
        } else if (resultResponse.data.results) {
          // Results are ready
          res.status(200).json(resultResponse.data.results);
          return;
        } else if (resultResponse.data.status === 'failed') {
          console.error('Task failed:', resultResponse.data);
          res.status(500).json({ message: 'Task failed to process' });
          return;
        } else {
          attempts++;
        }
      }

      res.status(500).json({ message: 'Failed to retrieve SERP results' });
    } catch (error) {
      console.error('Error fetching SERP results:', error.response?.data || error);
      res.status(500).json({ message: 'Error fetching SERP results' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
