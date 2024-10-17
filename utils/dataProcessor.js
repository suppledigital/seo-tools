// utils/dataProcessor.js
import pool from '../server/db'; // Adjust path

export async function processDataAndSave(project_id, data) {
  if (data[0][0]?.toLowerCase() === 'url') {
    data.shift();
  }

  let currentUrl = null;
  let currentTitle = '';
  let currentDescription = '';
  let keywords = [];
  let emptyKeywordLines = 0;

  for (let row of data) {
    const url = row[0]?.trim();
    const keyword = row[1]?.trim();
    const title = row[2]?.trim();
    const description = row[3]?.trim();

    if (url) {
      if (currentUrl && keywords.length > 0) {
        await saveEntry(project_id, currentUrl, currentTitle, currentDescription, keywords);
      }
      currentUrl = url;
      currentTitle = title;
      currentDescription = description;
      keywords = [];
      emptyKeywordLines = 0;
    }

    if (keyword) {
      keywords.push(keyword);
      emptyKeywordLines = 0;
    } else {
      emptyKeywordLines++;
    }

    if (emptyKeywordLines >= 2) {
      if (currentUrl && keywords.length > 0) {
        await saveEntry(project_id, currentUrl, currentTitle, currentDescription, keywords);
      }
      currentUrl = null;
      currentTitle = '';
      currentDescription = '';
      keywords = [];
      emptyKeywordLines = 0;
    }
  }

  if (currentUrl && keywords.length > 0) {
    await saveEntry(project_id, currentUrl, currentTitle, currentDescription, keywords);
  }
}

async function saveEntry(project_id, url, title, description, keywords) {
  const primary_keyword = keywords.shift();
  const secondary_keywords = keywords.join(',');

  await pool.query(
    'INSERT INTO entries (project_id, url, primary_keyword, secondary_keyword, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?)',
    [project_id, url, primary_keyword, secondary_keywords, title, description]
  );
}
