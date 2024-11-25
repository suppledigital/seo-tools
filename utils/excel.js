// utils/excel.js
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

/**
 * Create an Excel file with Landing Pages and Rankings data
 * @param {Object} data - The data to be written to Excel
 * @param {string} filePath - The path where the Excel file will be saved
 */
export const createExcelFile = async (data, filePath) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Create a worksheet for Landing Pages
    const landingPagesSheet = workbook.addWorksheet('Landing Pages');
    landingPagesSheet.columns = [
      { header: 'URL', key: 'url', width: 50 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Keywords', key: 'keywords', width: 50 },
    ];

    if (Array.isArray(data.landingPages)) {
      data.landingPages.forEach((page) => {
        if (page.url && page.title && Array.isArray(page.keywords)) {
          landingPagesSheet.addRow({
            url: page.url,
            title: page.title,
            keywords: page.keywords.join(', '),
          });
        } else {
          console.warn('Invalid landing page data:', page);
        }
      });
      console.log(`Added ${data.landingPages.length} landing pages to Excel.`);
    } else {
      console.warn('Landing Pages data is not an array.');
    }

    // Create a worksheet for Rankings
    const rankingsSheet = workbook.addWorksheet('Rankings');
    rankingsSheet.columns = [
      { header: 'Keyword', key: 'keyword', width: 30 },
      { header: 'Ranking', key: 'ranking', width: 10 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'SERP URL', key: 'serp_url', width: 50 },
      { header: 'Search Engine', key: 'search_engine', width: 20 },
      { header: 'Scan Date', key: 'scan_date', width: 20 },
      { header: 'Search Type', key: 'search_type', width: 15 },
    ];

    if (Array.isArray(data.rankings)) {
      data.rankings.forEach((rank) => {
        // Iterate through all positions and their scan histories
        rank.positions.forEach((position) => {
          if (Array.isArray(position.scan_history)) {
            position.scan_history.forEach((scan) => {
              rankingsSheet.addRow({
                keyword: rank.kw || '',
                ranking: scan.pos || '',
                location: position.location || '',
                serp_url: scan.url || '',
                search_engine: position.se || '',
                scan_date: scan.date || '',
                search_type: scan.type || 'organic',
              });
            });
          }
        });
      });
      console.log(`Added ranking history to Excel.`);
    } else {
      console.warn('Rankings data is not an array.');
    }

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }

    // Write to file
    await workbook.xlsx.writeFile(filePath);
    console.log(`Excel file successfully created at: ${filePath}`);
  } catch (error) {
    console.error('Error creating Excel file:', error);
    throw error; // Propagate the error to be handled by the caller
  }
};
