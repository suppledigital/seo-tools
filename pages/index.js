import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';


export default function Home() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch projects from the backend when the user is authenticated
      axios.get('/api/projects')
        .then((response) => {
          setProjects(response.data.projects);
        })
        .catch((error) => {
          console.error('Error fetching projects:', error);
        });
    }
  }, [status]);

  const handleAddProject = (e) => {
    e.preventDefault();
    axios.post('/api/projects', { project_name: newProjectName })
      .then(() => {
        setShowModal(false);
        setNewProjectName('');
        // Refresh projects list
        axios.get('/api/projects')
          .then((response) => {
            setProjects(response.data.projects);
          })
          .catch((error) => {
            console.error('Error fetching projects:', error);
          });
      })
      .catch((error) => {
        console.error('Error adding project:', error);
        alert('Error adding project.');
      });
  };

  // If not authenticated, display the Sign In button
  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <h1>Please Sign In</h1>
        <button onClick={() => signIn('google')}>Sign in with Google</button>
      </div>
    );
  }

  // Show the projects and sign-out button once signed in
  return (
    <div>
      <div id="top-panel">
        <h1>Content Projects</h1>
        <div className="user-icon">
          <span>Welcome, {session.user.email}</span>
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      </div>
      <div id="content">
        <div id="add-project-btn">
          <button onClick={() => setShowModal(true)}>Add New Project</button>
        </div>
        <br />
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.project_id}>
                <td>{project.project_name}</td>
                <td>
                  <Link href={`/projects/${project.project_id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setShowModal(false)}>&times;</span>
              <h2>Add New Project</h2>
              <form onSubmit={handleAddProject}>
                <div className="form-group">
                  <label htmlFor="project_name">Project Name:</label>
                  <input
                    type="text"
                    id="project_name"
                    name="project_name"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <button type="submit">Add Project</button>
              </form>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        /* Add your styles here */
      `}</style>
    </div>
  );
}
