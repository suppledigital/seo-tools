import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import styles from './index.module.css'; // Import the CSS module


export default function ContentHome() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      axios.get('/api/content/projects')
        .then((response) => setProjects(response.data.projects))
        .catch((error) => console.error('Error fetching projects:', error));
    }
  }, [status]);

  const handleAddProject = (e) => {
    e.preventDefault();
    axios.post('/api/content/projects', { project_name: newProjectName })
      .then(() => {
        setShowModal(false);
        setNewProjectName('');
        axios.get('/api/content/projects')
          .then((response) => setProjects(response.data.projects))
          .catch((error) => console.error('Error fetching projects:', error));
      })
      .catch((error) => {
        console.error('Error adding project:', error);
        alert('Error adding project.');
      });
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Please Sign In</h1>
        <button className={styles.button} onClick={() => signIn('google')}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Content Projects</h1>
      <p className={styles.welcomeText}>Welcome, {session?.user?.email}</p>
      <button className={styles.button} onClick={() => signOut()}>Sign Out</button>

      <div>
        <button className={styles.button} onClick={() => setShowModal(true)}>Add New Project</button>
        <br />
        <table className={styles.table}>
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
                  <Link href={`/content/projects/${project.project_id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <span className={styles.modalClose} onClick={() => setShowModal(false)}>&times;</span>
              <h2 className={styles.modalHeader}>Add New Project</h2>
              <form onSubmit={handleAddProject}>
                <div className={styles.formGroup}>
                  <label htmlFor="project_name">Project Name:</label>
                  <input
                    type="text"
                    id="project_name"
                    name="project_name"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <button className={styles.button} type="submit">Add Project</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
