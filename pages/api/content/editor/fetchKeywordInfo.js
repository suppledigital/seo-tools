// pages/api/content/editor/fetchKeywordInfo.js
import { getSession } from 'next-auth/react'
import pool from '../../../../lib/db'

export default async function handler(req, res) {
    const session = await getSession({ req })
    if (!session) return res.status(401).json({ error: 'Unauthorized' })
  
    const projectId = req.query.projectId
    if (!projectId) return res.status(400).json({ error: 'No projectId specified' })
  
    try {
      // e.g. check main_projects, then fetch from keywords
      const [mainRows] = await pool.query(
        'SELECT * FROM main_projects WHERE project_id = ?',
        [projectId]
      )
      if (!mainRows.length) {
        return res.status(404).json({ error: 'No main project found' })
      }
  
      const [keywordRows] = await pool.query(
        'SELECT * FROM keywords WHERE project_id = ?',
        [projectId]
      )
  
      return res.status(200).json({
        main_project: mainRows[0],
        keywords: keywordRows || [],
      })
    } catch (err) {
      console.error('Error in fetchKeywordInfo:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
  