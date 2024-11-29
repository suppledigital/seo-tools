// pages/api/content/semrush/organic-results.js

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { keyword, country, yearMonth } = req.body;

    try {
      const apiKey = process.env.SEMRUSH_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: 'SEMRush API key not configured.' });
      }

      // Map country code to SEMRush database
      const countryToDatabaseMap = {
        AU: 'au',
        US: 'us',
        UK: 'uk',
        NZ: 'nz',
        // Add more mappings as needed
      };

      const database = countryToDatabaseMap[country] || 'us'; // Default to 'us' if not found

      // Handle display_date parameter
      // If yearMonth is not provided, default to current year and month
      let displayDate;
      if (yearMonth) {
        // Ensure yearMonth is in YYYYMM format
        const regex = /^\d{6}$/;
        if (!regex.test(yearMonth)) {
          return res.status(400).json({ message: 'Invalid yearMonth format. Use YYYYMM.' });
        }
        displayDate = `${yearMonth}15`; // Append '15' as per SEMRush requirement
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        displayDate = `${year}${month}15`;
      }


      const params = {
        type: 'phrase_organic',
        key: apiKey,
        phrase: keyword,
        database: database,
        display_limit: 20, // Get top 10 results
        export_columns: 'Po,Pt,Dn,Ur,Fk,Fp', // Position, Domain, URL, Description, Title
        export_decode: '1', // Decode the response
        display_date: displayDate,
        positions_type: 'all'
      };

      // Make the request to SEMRush API
      const response = await axios.get('https://api.semrush.com/', { params });
      

      // SEMRush API returns data in CSV format, parse it
      const csvData = response.data;

      // Parse CSV data
      const parsedData = parseSemrushCSV(csvData);
      console.log(parsedData);

      res.status(200).json(parsedData);
    } catch (error) {
      console.error(
        'Error fetching SEMRush organic results:',
        error.response ? error.response.data : error.message
      );
      res.status(500).json({ message: 'Error fetching SEMRush organic results.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to parse CSV data from SEMRush API
function parseSemrushCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(';');
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';');
    const result = {};

    headers.forEach((header, index) => {
      // Remove quotes if present
      const cleanHeader = header.replace(/"/g, '');
      const cleanValue = row[index] ? row[index].replace(/"/g, '') : '';

      result[cleanHeader] = cleanValue;
    });

    results.push(result);
  }

  return results;
}
