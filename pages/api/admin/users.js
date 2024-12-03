// pages/api/admin/users.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // Adjust the path as needed
import pool from '../../../lib/db'; // Adjust the import path as needed

export default async function handler(req, res) {
  // Retrieve the session using getServerSession
  const session = await getServerSession(req, res, authOptions);

  // Safeguard: Ensure session and session.user exist
  if (!session || !session.user) {
    console.log('Access denied: No session or user found');
    return res.status(403).json({ message: 'Forbidden' });
  }
  // Check if the user has admin permissions
  if (session.user.permissions_level !== 'admin') {
    console.log('Access denied: User permissions level:', session.user.permissions_level);
    return res.status(403).json({ message: 'Forbidden: Not an admin' });
  }

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query('SELECT user_id, email, name, created_at, last_logged_in, permissions_level FROM users');
      res.status(200).json({ users: rows });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'PUT') {
    const { user_id, permissions_level } = req.body;

    if (!user_id || !['user', 'admin'].includes(permissions_level)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    try {
      await pool.query('UPDATE users SET permissions_level = ? WHERE user_id = ?', [permissions_level, user_id]);
      res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user permissions:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
