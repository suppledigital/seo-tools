// lib/serankingClient.js
export async function fetchSERanking(endpoint) {
  const res = await fetch(`https://api4.seranking.com${endpoint}`, {
    headers: {
      'Authorization': `Token ${process.env.SERANKING_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`SERanking API error: ${res.status} ${errorText}`);
  }
  return res.json();
}

  // Get all user projects (sites)
  export async function getAllSites() {
    return fetchSERanking('/sites');
  }
  
  // Get search engines for a given site
  export async function getSiteSearchEngines(site_id) {
    return fetchSERanking(`/sites/${site_id}/search-engines`);
  }
  
  // Get keywords for a given site
  export async function getSiteKeywords(site_id) {
    return fetchSERanking(`/sites/${site_id}/keywords`);
  }
  
  // lib/serankingClient.js
export async function getProjectStats(site_id) {
  return fetchSERanking(`/sites/${site_id}/stat`);
}

export async function getKeywordPositions(site_id, { date_from, date_to, site_engine_id }) {
  const params = new URLSearchParams();
  if (date_from) params.append('date_from', date_from);
  if (date_to) params.append('date_to', date_to);
  if (site_engine_id) params.append('site_engine_id', site_engine_id);
  params.append('with_landing_pages', '1');
  params.append('with_serp_features', '1');

  return fetchSERanking(`/sites/${site_id}/positions?${params.toString()}`);
}
