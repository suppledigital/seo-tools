// lib/dbHelpers.js
import pool from './db.js';

export async function initializeImportStatus(status_message) {
  const [result] = await pool.execute(
    'INSERT INTO import_status (status_message, processed_projects, total_projects, processed_keywords, total_keywords) VALUES (?, 0, 0, 0, 0)',
    [status_message]
  );
  return result.insertId; // return the generated statusId
}

export async function updateImportStatus(updates, statusId) {
  // Ensure we have a statusId
  if (!statusId) return;

  const fields = [];
  const values = [];

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key}=?`);
    values.push(val);
  }

  const sql = `UPDATE import_status SET ${fields.join(', ')} WHERE id=?`;
  values.push(statusId);
  await pool.execute(sql, values);
}


export async function upsertProject({ project_id, project_name, number_of_keywords }) {
  const sql = `
    INSERT INTO main_projects (project_id, project_name, number_of_keywords)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE project_name=VALUES(project_name), number_of_keywords=VALUES(number_of_keywords)
  `;
  await pool.execute(sql, [project_id, project_name, number_of_keywords]);
}


export async function updateProjectStats(project_id, stats) {
  const {
    today_avg,
    yesterday_avg,
    total_up,
    total_down,
    top5,
    top10,
    top30,
    visibility,
    visibility_percent
  } = stats;

  const sql = `
    UPDATE main_projects
    SET
      today_avg = ?,
      yesterday_avg = ?,
      total_up = ?,
      total_down = ?,
      top5 = ?,
      top10 = ?,
      top30 = ?,
      visibility = ?,
      visibility_percent = ?
    WHERE project_id = ?
  `;
  await pool.execute(sql, [
    today_avg, yesterday_avg, total_up, total_down, top5, top10, top30, visibility, visibility_percent, project_id
  ]);
}

export async function upsertSearchEngine({ site_engine_id, name, url }) {
  const sql = `
    INSERT INTO search_engines (site_engine_id, name, url)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE name=VALUES(name), url=VALUES(url)
  `;
  await pool.execute(sql, [site_engine_id, name, url]);
}

export async function deleteKeywordsForProject(project_id) {
  await pool.execute('DELETE FROM keywords WHERE project_id = ?', [project_id]);
}
export async function getImportStatus(statusId) {
  const [rows] = await pool.execute('SELECT * FROM import_status WHERE id=?', [statusId]);
  return rows[0] || {};
}

export async function insertKeyword({ keyword_id, project_id, search_engine_id, keyword, current_ranking, previous_ranking, ranking_url }) {
  const sql = `
    INSERT INTO keywords (keyword_id, project_id, search_engine_id, keyword, current_ranking, previous_ranking, ranking_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await pool.execute(sql, [
    keyword_id,
    project_id,
    search_engine_id,
    keyword,
    current_ranking,
    previous_ranking,
    ranking_url
  ]);
}

export async function updateKeywordData({
  keyword_id,
  pos,
  change,
  is_map,
  map_position,
  paid_position,
  volume,
  competition,
  suggested_bid,
  cpc,
  results,
  kei,
  total_sum,
  landing_pages,
  features
}) {
  // Convert undefined to null
  const safePos = pos ?? null;
  const safeChange = change ?? null;
  const safeIsMap = is_map ?? null;
  const safeMapPosition = map_position ?? null;
  const safePaidPosition = paid_position ?? null;
  const safeVolume = volume ?? null;
  const safeCompetition = competition ?? null;
  const safeSuggestedBid = suggested_bid ?? null;
  const safeCpc = cpc ?? null;
  const safeResults = results ?? null;
  const safeKei = kei ?? null;
  const safeTotalSum = total_sum ?? null;
  const safeLandingPages = landing_pages ? JSON.stringify(landing_pages) : '[]';
  const safeFeatures = features ? JSON.stringify(features) : '[]';

  // Derive current_ranking and previous_ranking if needed
  // For example:
  const current_ranking = safePos;
  let previous_ranking = null;
  if (safePos !== null && safeChange !== null) {
    const prev = safePos - safeChange;
    previous_ranking = prev >= 0 ? prev : null;
  }
  console.log(keyword_id,
    pos,
    change,
    is_map,
    map_position,
    paid_position,
    volume,
    competition,
    suggested_bid,
    cpc,
    results,
    kei,
    total_sum,
    landing_pages,
    features);

  const sql = `
    UPDATE keywords
    SET
      current_ranking = ?,
      previous_ranking = ?,
      pos = ?,
      change_value = ?,
      is_map = ?,
      map_position = ?,
      paid_position = ?,
      volume = ?,
      competition = ?,
      suggested_bid = ?,
      cpc = ?,
      results = ?,
      kei = ?,
      total_sum = ?,
      landing_pages_json = ?,
      features_json = ?
    WHERE keyword_id = ?
  `;

  await pool.execute(sql, [
    current_ranking,
    previous_ranking,
    safePos,
    safeChange,
    safeIsMap,
    safeMapPosition,
    safePaidPosition,
    safeVolume,
    safeCompetition,
    safeSuggestedBid,
    safeCpc,
    safeResults,
    safeKei,
    safeTotalSum,
    safeLandingPages,
    safeFeatures,
    keyword_id
  ]);
}
export async function getProjects() {
  const sql = `
    SELECT 
      project_id,
      project_name,
      number_of_keywords,
      today_avg,
      yesterday_avg,
      total_up,
      total_down,
      top5,
      top10,
      top30,
      visibility,
      visibility_percent
    FROM main_projects
    ORDER BY project_name ASC
  `;
  const [rows] = await pool.execute(sql);
  return rows;
}

/**
 * Get all keywords with details, joining projects and search_engines.
 * This will return keyword rows along with the project_name and search_engine_name.
 */
export async function getAllKeywordsWithDetails() {
  const sql = `
    SELECT 
      k.keyword_id,
      k.keyword,
      k.current_ranking,
      k.previous_ranking,
      k.pos,
      k.change_value,
      k.is_map,
      k.map_position,
      k.volume,
      k.competition,
      k.suggested_bid,
      k.cpc,
      k.results,
      k.kei,
      k.total_sum,
      k.landing_pages_json,
      k.features_json,
      k.ranking_url,
      p.project_name,
      se.name AS search_engine_name
    FROM keywords k
    JOIN main_projects p ON k.project_id = p.project_id
    JOIN search_engines se ON k.search_engine_id = se.site_engine_id
    ORDER BY p.project_name, k.keyword
  `;
  const [rows] = await pool.execute(sql);
  return rows;
}
