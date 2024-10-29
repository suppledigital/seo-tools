// pages/keywords.js

import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaTrash } from 'react-icons/fa';
import Link from 'next/link';


export default function KeywordsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch projects from BigQuery via API route
    fetch('/api/keywords/get-projects')
      .then(res => res.json())
      .then(data => setProjects(data.projects));
  }, []);

  const updateDatabase = async () => {
    setLoading(true);
    const res = await fetch('/api/keywords');
    const data = await res.json();
    setLoading(false);
    // Optionally, refetch the projects to update the UI
  };

  const deleteProject = async (projectId) => {
    const res = await fetch(`/api/keywords/delete-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    if (res.ok) {
      setProjects(projects.filter(project => project.id !== projectId));
    } else {
      // Handle error
      console.error('Failed to delete project');
    }
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-primary mb-3" onClick={updateDatabase} disabled={loading}>
        {loading ? 'Updating...' : 'Update Database'}
      </button>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Title</th>
            <th>Keyword Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id}>
              <td>{project.id}</td>
              <td>                
                <Link href={`/keywords/project?projectId=${project.id}`}>{project.title}</Link>
              </td>
              <td>{project.keyword_count}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProject(project.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}