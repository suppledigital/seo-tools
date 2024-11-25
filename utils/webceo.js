// utils/webceo.js
import axios from 'axios';
import qs from 'qs'; // For URL encoding

const WEBCEO_BASE_URL = process.env.WEBCEO_BASE_URL || 'https://online.webceo.com/api/';

/**
 * Generic function to call WebCEO API
 * @param {string} method - The API method to call
 * @param {object} data - Additional parameters for the API method
 * @returns {object} - The response from the API
 */
export const callWebCEOAPI = async (method, data = {}) => {
  try {
    const payload = {
      key: process.env.WEBCEO_API_KEY, // Ensure this is set in your .env.local
      method: method,
      ...data,
    };

    const response = await axios.post(
      WEBCEO_BASE_URL,
      qs.stringify({ json: JSON.stringify(payload) }), // 'json=' + urlencode(json_encode($data))
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Assuming the response is an array and we need the first element
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    console.error(`Error calling WebCEO API method "${method}":`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch all projects from WebCEO
 * @param {object} filters - Filters for fetching projects
 */
export const fetchProjects = async (filters = {}) => {
  return await callWebCEOAPI('get_projects', filters);
};

/**
 * Fetch landing pages for a specific project
 * @param {string} projectId
 */
export const fetchLandingPages = async (projectId) => {
  return await callWebCEOAPI('get_landing_pages', { project: projectId });
};

/**
 * Fetch rankings for a specific project
 * @param {string} projectId
 * @param {object} options - Options for fetching rankings
 */
export const fetchRankings = async (projectId, options = {}) => {
  return await callWebCEOAPI('get_rankings', {
    project: projectId,
    grouped: options.grouped || 0,
    pages_filter: options.pages_filter || [],
    competitors: options.competitors || 0,
    history_depth: options.history_depth || 2,
    ...options.filters, // scanned_from, scanned_earlier
  });
};
