// pages/api/content/editor/fetchProjectInfo.js
import { getSession } from 'next-auth/react'
import pool from '../../../../lib/db'

export default async function handler(req, res) {
    const session = await getSession({ req })
    if (!session) return res.status(401).json({ error: 'Unauthorized' })
  
    const projectId = req.query.projectId
    if (!projectId) return res.status(400).json({ error: 'No projectId specified' })
  
    try {
      const [rows] = await pool.query(
        'SELECT * FROM projects WHERE project_id = ?',
        [projectId]
      )
      if (!rows.length) {
        return res.status(404).json({ error: 'Project not found' })
      }
      return res.status(200).json(rows[0])
    } catch (err) {
      console.error('Error in fetchProjectInfo:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }