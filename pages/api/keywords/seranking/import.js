// pages/api/keywords/seranking/import.js
import dayjs from 'dayjs';

import { 
  getAllSites, 
  getSiteSearchEngines, 
  getSiteKeywords, 
  getProjectStats, 
  getKeywordPositions 
} from '../../../../lib/serankingClient';
import { 
  upsertProject, 
  upsertSearchEngine, 
  deleteKeywordsForProject, 
  insertKeyword,
  updateProjectStats,
  updateKeywordData,
  initializeImportStatus,
  updateImportStatus,
  getImportStatus
} from '../../../../lib/dbHelpers';
import pool from '../../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let statusId;

  try {
    statusId = await initializeImportStatus('Starting import...');

    const sites = await getAllSites();
    const totalProjects = sites.length;
    await updateImportStatus({ total_projects: totalProjects }, statusId);

    let processedProjects = 0;

    for (const site of sites) {
      // Check for pause/stop before each project
      await checkPauseStop(statusId);

      const project_id = site.id;
      const project_name = site.title;
      const number_of_keywords = site.keyword_count || 0;

      await upsertProject({ project_id, project_name, number_of_keywords });

      const stats = await getProjectStats(project_id);
      await updateProjectStats(project_id, stats);

      const seList = await getSiteSearchEngines(project_id);
      for (const se of seList) {
        await upsertSearchEngine({
          site_engine_id: se.site_engine_id,
          name: `SE #${se.search_engine_id}`,
          url: ''
        });
      }

      await deleteKeywordsForProject(project_id);

      const keywords = await getSiteKeywords(project_id);
      const totalKeywords = keywords.reduce((count, kw) => count + ((kw.site_engine_ids && kw.site_engine_ids.length) || 0), 0);
      await updateImportStatus({ 
        status_message: `Importing keywords for project ${project_name}...`,
        total_keywords: totalKeywords, 
        processed_keywords: 0 
      }, statusId);

      let processedKeywords = 0;

      for (const kw of keywords) {
        // Check for pause/stop before processing each keyword set
        await checkPauseStop(statusId);

        if (kw.site_engine_ids && kw.site_engine_ids.length > 0) {
          for (const site_engine_id of kw.site_engine_ids) {
            await insertKeyword({
              keyword_id: kw.id,
              project_id,
              search_engine_id: site_engine_id,
              keyword: kw.name,
              current_ranking: null,
              previous_ranking: null,
              ranking_url: kw.link || null
            });
            processedKeywords++;
            if (processedKeywords % 10 === 0) {
              await updateImportStatus({ processed_keywords: processedKeywords }, statusId);
            }
          }
        }
      }

      // Fetch positions
      const today = dayjs().format('YYYY-MM-DD');
      const date_from = dayjs().subtract(2, 'month').format('YYYY-MM-DD'); // 2 months ago
      const date_to = today; // today's date
      for (const se of seList) {
        // Check pause/stop again if needed
        await checkPauseStop(statusId);
        
        const positionsData = await getKeywordPositions(project_id, {
          date_from,
          date_to,
          site_engine_id: se.site_engine_id
        });

        for (const engineData of positionsData) {
          for (const kwData of engineData.keywords) {
            if (kwData.positions && kwData.positions.length > 0) {
              // Sort positions by date descending to get the latest first
              kwData.positions.sort((a, b) => b.date.localeCompare(a.date));
              const posEntryLatest = kwData.positions[0]; // most recent
              const pos = posEntryLatest.pos;
        
              let change = 0;
              let previous_ranking = null;

              if (kwData.positions.length > 1) {
                const posEntrySecondLatest = kwData.positions[1];
                const posPrevious = posEntrySecondLatest.pos;
                // change = pos_current - pos_previous
                change = pos - posPrevious;
                previous_ranking = posPrevious;
              } else {
                // Only one date available
                change = 0;
                previous_ranking = null;
              }        
        
              // Pass pos and change to updateKeywordData, it will derive previous_ranking correctly
            // Actually, to ensure correct previous_ranking calculation (pos - change = previous_ranking),
            // we have set change = pos - posPrevious,
            // so previous_ranking = pos - change = pos - (pos - posPrevious) = posPrevious
            // Perfect!
            await updateKeywordData({
                keyword_id: kwData.id,
                project_id,
                search_engine_id: se.site_engine_id,
                pos,
                change,
                is_map: posEntryLatest.is_map,
                map_position: posEntryLatest.map_position,
                paid_position: posEntryLatest.paid_position,
                volume: kwData.volume,
                competition: kwData.competition,
                suggested_bid: kwData.suggested_bid,
                cpc: kwData.cpc,
                results: kwData.results,
                kei: kwData.kei,
                total_sum: kwData.total_sum,
                landing_pages: kwData.landing_pages,
                features: kwData.features
              });
            }
          }
        }

      }

      processedProjects++;
      await updateImportStatus({ processed_projects: processedProjects }, statusId);
    }

    await updateImportStatus({ status_message: 'Import completed successfully.' }, statusId);
    res.status(200).json({ message: 'Import completed successfully.', statusId });
  } catch (error) {
    console.error('Error during import:', error);
    if (statusId) {
      await updateImportStatus({ status_message: 'Import failed.' }, statusId);
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

async function checkPauseStop(statusId) {
  // Check DB for pause/stop
  const status = await getImportStatus(statusId);
  if (status.is_stopped) {
    throw new Error('Import stopped by user.');
  }
  while (status.is_paused) {
    // If paused, wait some time, then re-check
    await new Promise(r => setTimeout(r, 2000));
    const updatedStatus = await getImportStatus(statusId);
    if (updatedStatus.is_stopped) {
      throw new Error('Import stopped by user.');
    }
    if (!updatedStatus.is_paused) {
      break; // resume execution
    }
  }
}