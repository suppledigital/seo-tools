// pages/api/projects/save-data.js
import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { project_id, data } = req.body;

    try {
      // Build the server API URL
      const serverApiUrl = `${process.env.SERVER_API_URL}/projects/${project_id}/save-data`;

      // Forward the request to the server API
      const response = await axios.post(serverApiUrl, { data }, {
        headers: {
          // Pass any necessary headers or authentication tokens
          Cookie: req.headers.cookie || '',
        },
      });

      // Return the response from the server API
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Error saving data:', error);

      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ message: 'Error saving data' });
      }
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
