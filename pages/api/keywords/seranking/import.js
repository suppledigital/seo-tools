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
      for (const se of seList) {
        // Check pause/stop again if needed
        await checkPauseStop(statusId);
        
        const positionsData = await getKeywordPositions(project_id, {
         
          site_engine_id: se.site_engine_id
        });

        // After getting positionsData
        for (const engineData of positionsData) {
          for (const kwData of engineData.keywords) {
            if (kwData.positions && kwData.positions.length > 0) {
              const posEntry = kwData.positions[0];
              await updateKeywordData({
                keyword_id: kwData.id,
                // From posEntry
                pos: posEntry.pos,
                change: posEntry.change,
                is_map: posEntry.is_map,
                map_position: posEntry.map_position,
                paid_position: posEntry.paid_position, // If you also want to store paid_position
                // From kwData
                volume: kwData.volume,
                competition: kwData.competition,
                suggested_bid: kwData.suggested_bid,
                cpc: kwData.cpc,              // added cpc
                results: kwData.results,      // added results
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
    res.status(200).json({ message: 'Import completed successfully.' });
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