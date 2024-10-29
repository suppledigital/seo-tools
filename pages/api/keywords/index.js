import { BigQuery } from '@google-cloud/bigquery';
import fetch from 'node-fetch';
import path from 'path';

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS),
});
console.log("Connection successful");

export default async function handler(req, res) {
  try {
    const serankingApiKey = process.env.SERANKING_API_KEY;

    // Fetch projects from SEranking API
    const projectsResponse = await fetch('https://api4.seranking.com/sites', {
      headers: {
        Authorization: `Token ${serankingApiKey}`,
      },
    });

    const projects = await projectsResponse.json();

    // Format projects data
    const formattedProjects = formatProjectsData(projects);

    // Insert projects into BigQuery
    const datasetId = 'seranking_data';
    const projectsTableId = 'projects';

    // Define projects table schema
    const projectsSchema = [
      { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'title', type: 'STRING', mode: 'NULLABLE' },
      { name: 'name', type: 'STRING', mode: 'NULLABLE' },
      { name: 'group_id', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'is_active', type: 'BOOLEAN', mode: 'NULLABLE' },
      { name: 'exact_url', type: 'BOOLEAN', mode: 'NULLABLE' },
      { name: 'subdomain_match', type: 'BOOLEAN', mode: 'NULLABLE' },
      { name: 'depth', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'check_freq', type: 'STRING', mode: 'NULLABLE' },
      { name: 'check_day', type: 'STRING', mode: 'NULLABLE' },
      { name: 'guest_link', type: 'STRING', mode: 'NULLABLE' },
      { name: 'keyword_count', type: 'INTEGER', mode: 'NULLABLE' },
    ];

    // Overwrite projects table
    await ensureTableExists(datasetId, projectsTableId, projectsSchema, { overwrite: true });

    // Insert projects data
    try {
      await bigquery.dataset(datasetId).table(projectsTableId).insert(formattedProjects);
    } catch (error) {
      console.error('Projects Insertion Error:', error);
      if (error && error.name === 'PartialFailureError') {
        console.error('Partial Failure Errors:', JSON.stringify(error.errors, null, 2));
      }
    }

    // Prepare the search_engines table
    const searchEnginesTableId = 'search_engines';

    // Define search_engines table schema
    const searchEnginesSchema = [
      { name: 'site_id', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'site_engine_id', type: 'INTEGER', mode: 'REQUIRED' },
      { name: 'search_engine_id', type: 'INTEGER', mode: 'NULLABLE' },
      { name: 'region_name', type: 'STRING', mode: 'NULLABLE' },
      { name: 'lang_code', type: 'STRING', mode: 'NULLABLE' },
      { name: 'merge_map', type: 'BOOLEAN', mode: 'NULLABLE' },
      { name: 'business_name', type: 'STRING', mode: 'NULLABLE' },
      { name: 'phone', type: 'STRING', mode: 'NULLABLE' },
      { name: 'paid_results', type: 'BOOLEAN', mode: 'NULLABLE' },
      { name: 'featured_snippet', type: 'BOOLEAN', mode: 'NULLABLE' },
      { name: 'keyword_count', type: 'INTEGER', mode: 'NULLABLE' },
    ];

    await ensureTableExists(datasetId, searchEnginesTableId, searchEnginesSchema, { overwrite: true });

    // Insert search engines data
    let allSearchEngines = [];

    for (const project of projects) {
      const { id: siteId } = project;

      // Fetch search engines for the project
      const searchEnginesResponse = await fetch(
        `https://api4.seranking.com/sites/${siteId}/search-engines`,
        {
          headers: {
            Authorization: `Token ${serankingApiKey}`,
          },
        }
      );
      const searchEngines = await searchEnginesResponse.json();

      // Format and collect search engines data
      const formattedSearchEngines = formatSearchEnginesData(searchEngines, siteId);
      allSearchEngines = allSearchEngines.concat(formattedSearchEngines);
    }

    // Insert all search engines data
    try {
      await bigquery.dataset(datasetId).table(searchEnginesTableId).insert(allSearchEngines);
    } catch (error) {
      console.error('Search Engines Insertion Error:', error);
      if (error && error.name === 'PartialFailureError') {
        console.error('Partial Failure Errors:', JSON.stringify(error.errors, null, 2));
      }
    }

    // Now handle keywords for each project
    for (const project of projects) {
      const { id: siteId } = project;
      const keywordsTableId = `project_${siteId}_keywords`;

      // Define keywords table schema
      const keywordsSchema = [
        { name: 'keyword_id', type: 'INTEGER', mode: 'REQUIRED' },
        { name: 'keyword', type: 'STRING', mode: 'NULLABLE' },
        { name: 'site_engine_id', type: 'INTEGER', mode: 'REQUIRED' },
        {
          name: 'positions',
          type: 'RECORD',
          mode: 'REPEATED',
          fields: [
            { name: 'date', type: 'DATE', mode: 'NULLABLE' },
            { name: 'pos', type: 'INTEGER', mode: 'NULLABLE' },
            { name: 'change', type: 'INTEGER', mode: 'NULLABLE' },
            { name: 'price', type: 'FLOAT', mode: 'NULLABLE' },
            { name: 'is_map', type: 'BOOLEAN', mode: 'NULLABLE' },
            { name: 'map_position', type: 'INTEGER', mode: 'NULLABLE' },
            { name: 'paid_position', type: 'INTEGER', mode: 'NULLABLE' },
          ],
        },
        { name: 'volume', type: 'INTEGER', mode: 'NULLABLE' },
        { name: 'competition', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'suggested_bid', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'kei', type: 'FLOAT', mode: 'NULLABLE' },
        { name: 'results', type: 'INTEGER', mode: 'NULLABLE' },
        { name: 'total_sum', type: 'FLOAT', mode: 'NULLABLE' },
        {
          name: 'landing_pages',
          type: 'RECORD',
          mode: 'REPEATED',
          fields: [
            { name: 'url', type: 'STRING', mode: 'NULLABLE' },
            { name: 'date', type: 'DATE', mode: 'NULLABLE' },
          ],
        },
        {
          name: 'features',
          type: 'RECORD',
          mode: 'NULLABLE',
          fields: [
            { name: 'tads', type: 'BOOLEAN', mode: 'NULLABLE' },
            { name: 'knowledge_graph', type: 'BOOLEAN', mode: 'NULLABLE' },
            { name: 'images', type: 'BOOLEAN', mode: 'NULLABLE' },
            { name: 'sitelinks', type: 'BOOLEAN', mode: 'NULLABLE' },
            { name: 'reviews', type: 'BOOLEAN', mode: 'NULLABLE' },
          ],
        },
      ];

      // Ensure keywords table exists
      await ensureTableExists(datasetId, keywordsTableId, keywordsSchema, { overwrite: true });

      for (const engine of allSearchEngines.filter(e => e.site_id === siteId)) {
        const { site_engine_id } = engine;

        // Fetch keyword statistics
        const keywordsResponse = await fetch(
          `https://api4.seranking.com/sites/${siteId}/positions?site_engine_id=${site_engine_id}&with_landing_pages=1&with_serp_features=1`,
          {
            headers: {
              Authorization: `Token ${serankingApiKey}`,
            },
          }
        );
        const keywordsData = await keywordsResponse.json();

        // Format keywords data
        const formattedKeywords = formatKeywordsData(keywordsData);

        // Insert keywords data
        try {
          await bigquery.dataset(datasetId).table(keywordsTableId).insert(formattedKeywords);
        } catch (error) {
          console.error('Keywords Insertion Error:', error);
          if (error && error.name === 'PartialFailureError') {
            console.error('Partial Failure Errors:', JSON.stringify(error.errors, null, 2));
          }
        }
      }
    }

    res.status(200).json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error('Handler Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function ensureTableExists(datasetId, tableId, schema, options = {}) {
  const dataset = bigquery.dataset(datasetId);
  const table = dataset.table(tableId);

  const [exists] = await table.exists();
  if (!exists) {
    await table.create({ schema });
  } else if (options.overwrite) {
    // Delete the table and recreate it
    await table.delete();
    await table.create({ schema });
  }
}

function formatProjectsData(projects) {
  return projects.map(project => ({
    id: parseInt(project.id),
    title: project.title || null,
    name: project.name || null,
    group_id: project.group_id !== null ? parseInt(project.group_id) : null,
    is_active: project.is_active === 1,
    exact_url: project.exact_url === 1,
    subdomain_match: project.subdomain_match === 1,
    depth: project.depth !== null ? parseInt(project.depth) : null,
    check_freq: project.check_freq || null,
    check_day: project.check_day || null,
    guest_link: project.guest_link || null,
    keyword_count: project.keyword_count !== null ? parseInt(project.keyword_count) : null,
  }));
}

function formatSearchEnginesData(searchEngines, siteId) {
  return searchEngines.map(engine => ({
    site_id: parseInt(siteId),
    site_engine_id: parseInt(engine.site_engine_id),
    search_engine_id: engine.search_engine_id !== null ? parseInt(engine.search_engine_id) : null,
    region_name: engine.region_name || null,
    lang_code: engine.lang_code || null,
    merge_map: engine.merge_map === 1,
    business_name: engine.business_name || null,
    phone: engine.phone || null,
    paid_results: engine.paid_results === 1,
    featured_snippet: engine.featured_snippet === 1,
    keyword_count: engine.keyword_count !== null ? parseInt(engine.keyword_count) : null,
  }));
}

function formatKeywordsData(keywordsData) {
    // Since we're fetching data for a specific site_engine_id, keywordsData should be an array with one element
    if (!Array.isArray(keywordsData) || keywordsData.length === 0) {
      return [];
    }
  
    const engineData = keywordsData[0];
    const site_engine_id = parseInt(engineData.site_engine_id);
  
    return engineData.keywords.map(keyword => ({
      keyword_id: parseInt(keyword.id),
      keyword: keyword.name || null, // Include the keyword text
      site_engine_id: site_engine_id, // Include site_engine_id
      positions: keyword.positions.map(pos => ({
        date: pos.date,
        pos: pos.pos !== null ? parseInt(pos.pos) : null,
        change: pos.change !== null ? parseInt(pos.change) : null,
        price: pos.price !== null ? parseFloat(pos.price) : null,
        is_map: pos.is_map === 1,
        map_position: pos.map_position !== null ? parseInt(pos.map_position) : null,
        paid_position: pos.paid_position !== null ? parseInt(pos.paid_position) : null,
      })),
      volume: keyword.volume !== null ? parseInt(keyword.volume) : null,
      competition: keyword.competition !== null ? parseFloat(keyword.competition) : null,
      suggested_bid: keyword.suggested_bid !== null ? parseFloat(keyword.suggested_bid) : null,
      kei: keyword.kei !== null ? parseFloat(keyword.kei) : null,
      results: keyword.results !== null ? parseInt(keyword.results) : null,
      total_sum: keyword.total_sum !== null ? parseFloat(keyword.total_sum) : null,
      landing_pages: keyword.landing_pages.map(lp => ({
        url: lp.url,
        date: lp.date,
      })),
      features: {
        tads: Boolean(keyword.features.tads),
        knowledge_graph: Boolean(keyword.features.knowledge_graph),
        images: Boolean(keyword.features.images),
        sitelinks: Boolean(keyword.features.sitelinks),
        reviews: Boolean(keyword.features.reviews),
      },
    }));
  }
  
