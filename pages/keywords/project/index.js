// pages/keywords/project/index.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ProjectKeywordsPage() {
  const router = useRouter();
  const { projectId: initialProjectId } = router.query;

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [keywords, setKeywords] = useState([]);

  useEffect(() => {
    // Fetch all projects to populate the project dropdown
    fetch('/api/keywords/get-projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects);
        // If initialProjectId is present, set it as selected
        if (initialProjectId) {
          setSelectedProjectId(initialProjectId);
        }
      });
  }, [initialProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      // Fetch regions (site_engine_id and region_name) for the selected project
      fetch(`/api/keywords/get-regions?projectId=${selectedProjectId}`)
        .then(res => res.json())
        .then(data => {
          setRegions(data.regions);
          // Reset selected region when project changes
          setSelectedRegionId('');
          setKeywords([]);
        });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && selectedRegionId) {
      // Fetch keywords for the selected project and region
      fetch(
        `/api/keywords/get-keywords?projectId=${selectedProjectId}&siteEngineId=${selectedRegionId}`
      )
        .then(res => res.json())
        .then(data => {
          setKeywords(data.keywords);
        });
    }
  }, [selectedProjectId, selectedRegionId]);

  return (
    <div className="container mt-4">
      <h2>Keyword Rankings</h2>

      {/* Project Selection Dropdown */}
      <div className="form-group">
        <label htmlFor="projectSelect">Select Project</label>
        <select
          id="projectSelect"
          className="form-control"
          value={selectedProjectId}
          onChange={e => setSelectedProjectId(e.target.value)}
        >
          <option value="">-- Select Project --</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>

      {/* Region Selection Dropdown */}
      {selectedProjectId && (
        <div className="form-group">
          <label htmlFor="regionSelect">Select Region</label>
          <select
            id="regionSelect"
            className="form-control"
            value={selectedRegionId}
            onChange={e => setSelectedRegionId(e.target.value)}
          >
            <option value="">-- Select Region --</option>
            {regions.map(region => (
              <option key={region.site_engine_id} value={region.site_engine_id}>
                {region.region_name} ({region.site_engine_id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Keywords Table */}
      {selectedRegionId && keywords.length > 0 && (
        <table className="table table-striped mt-4">
          <thead>
            <tr>
              <th>Keyword ID</th>
              <th>Keyword</th>
              <th>Position</th>
              <th>Date</th>
              <th>URL</th>

              {/* Add more columns as needed */}
            </tr>
          </thead>
          <tbody>
            {keywords.map(keyword => (
              <tr key={keyword.keyword_id}>
                <td>{keyword.keyword_id}</td>
                <td>{keyword.keyword}</td>
                <td>{keyword.position}</td>
                <td>{keyword.date}</td>
                <td>{keyword.landing_pages}</td>

                {/* Add more data as needed */}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* No Keywords Message */}
      {selectedRegionId && keywords.length === 0 && (
        <p>No keywords found for the selected project and region.</p>
      )}
    </div>
  );
}
