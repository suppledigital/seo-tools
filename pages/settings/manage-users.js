// pages/content/settings/manage-users.js
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './manage-users.module.css';
import { useRouter } from 'next/router';


export default function ManageUsers() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.permissions_level !== 'admin') {
      router.push('/'); // Redirect if not admin
    } else {
      fetchUsers();
    }
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    }
  };

  const handlePermissionChange = async (userId, newPermission) => {
    try {
      await axios.put('/api/admin/users', { user_id: userId, permissions_level: newPermission });
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error updating user permissions:', error);
      alert('Failed to update permissions.');
    }
  };

  if (status === 'loading' || isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Manage Users</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Created At</th>
            <th>Last Logged In</th>
            <th>Permissions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td>{user.email}</td>
              <td>{user.name}</td>
              <td>{new Date(user.created_at).toLocaleString()}</td>
              <td>{new Date(user.last_logged_in).toLocaleString()}</td>
              <td>
                <select
                  className={styles.selectUser}
                  value={user.permissions_level}
                  onChange={(e) => handlePermissionChange(user.user_id, e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
