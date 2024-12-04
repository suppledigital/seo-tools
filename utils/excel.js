// utils/excel.js
import fs from 'fs';
import path from 'path';

/**
 * Create a CSV file for Rankings data.
 * @param {Object} data - The data to be written to the CSV file.
 * @param {string} filePath - The path where the CSV file will be saved.
 */
export const createCsvFile = async (data, filePath) => {
  try {
    if (!Array.isArray(data.rankings)) {
      throw new Error('Rankings data is not an array.');
    }

    // Extract all scan dates for headers
    const allDates = new Set();
    data.rankings.forEach((rank) => {
      rank.positions.forEach((position) => {
        if (Array.isArray(position.scan_history)) {
          position.scan_history.forEach((scan) => {
            allDates.add(scan.date);
          });
        }
      });
    });

    const sortedDates = Array.from(allDates).sort();

    // Prepare CSV headers
    const headers = ['', '', ...sortedDates];
    const rows = [headers];

    // Prepare rows for each keyword
    data.rankings.forEach((rank) => {
      const row = Array(headers.length).fill('');
      row[0] = rank.kw; // Keyword in first column

      rank.positions.forEach((position) => {
        if (Array.isArray(position.scan_history)) {
          position.scan_history.forEach((scan) => {
            const dateIndex = headers.indexOf(scan.date);
            if (dateIndex !== -1) {
              row[dateIndex] = scan.pos || '-';
            }
          });
        }
      });

      rows.push(row);
    });

    // Write rows to CSV format
    const csvContent = rows.map((row) => row.join('\t')).join('\n'); // Tab-separated values

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to the file
    await fs.promises.writeFile(filePath, csvContent, 'utf8');
    console.log(`CSV file successfully created at: ${filePath}`);
  } catch (error) {
    console.error('Error creating CSV file:', error);
    throw error;
  }
};
