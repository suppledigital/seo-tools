// pages/api/semrush/paa-suggestions.js

import axios from 'axios';

export default async function handler(req, res) {
  const { keyword, country } = req.body;

  const apiKey = process.env.SEMRUSH_API_KEY;

  const databases = {
    AU: 'au',
    US: 'us',
    UK: 'uk',
    NZ: 'nz',
    // Add more as needed
  };

  const database = databases[country] || 'au';

  try {
    const baseUrl = 'https://api.semrush.com/';
    const exportColumns = 'Ph,Nq,Cp,Co,Kd';

    // Related Keywords
    const relatedResponse = await axios.get(baseUrl, {
      params: {
        type: 'phrase_related',
        key: apiKey,
        phrase: keyword,
        database: database,
        export_columns: exportColumns,
        display_limit: 20,
      },
    });
    const relatedKeywords = parseSemrushResponse(relatedResponse.data);

    // Broad Match Keywords
    const broadResponse = await axios.get(baseUrl, {
      params: {
        type: 'phrase_fullsearch',
        key: apiKey,
        phrase: keyword,
        database: database,
        export_columns: exportColumns,
        display_limit: 100,
      },
    });
    const broadMatchKeywords = parseSemrushResponse(broadResponse.data);

    res.status(200).json({
      relatedKeywords,
      broadMatchKeywords,
    });
  } catch (error) {
    console.error('Error fetching PAA suggestions:', error);
    res.status(500).json({ error: 'Error fetching PAA suggestions' });
  }
}

function parseSemrushResponse(responseText) {
  if (!responseText || responseText.trim() === '') {
    return [];
  }

  const lines = responseText.trim().split('\n');
  const rawHeaders = lines[0].split(';');

  // Map raw headers to standard keys
  const headerMap = {
    'Keyword': 'keyword',
    'Search Volume': 'volume',
    'CPC': 'cpc',
    'Competition': 'competition',
    'Keyword Difficulty Index': 'kd',
    'Keyword Difficulty Index\r': 'kd', // Handle possible \r
    // Add other mappings if necessary
  };

  const headers = rawHeaders.map((h) => {
    const cleanHeader = h.trim().replace(/\r$/, '');
    return headerMap[cleanHeader] || cleanHeader;
  });

  return lines.slice(1).map((line) => {
    const values = line.split(';');
    const entry = {};
    headers.forEach((header, index) => {
      const value = values[index] ? values[index].trim().replace(/\r$/, '') : '';
      entry[header] = value;
    });
    return entry;
  });
}
