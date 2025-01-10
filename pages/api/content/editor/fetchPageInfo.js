// pages/api/content/editor/fetchPageInfo.js
import { getSession } from 'next-auth/react'
import pool from '../../../../lib/db'

export default async function handler(req, res) {
    const session = await getSession({ req })
    if (!session) return res.status(401).json({ error: 'Unauthorized' })
  
    const entryId = req.query.entryId
    if (!entryId) return res.status(400).json({ error: 'No entryId specified' })
  
    try {
      const [rows] = await pool.query(
        'SELECT * FROM entries WHERE entry_id = ?',
        [entryId]
      )
      if (!rows.length) {
        return res.status(404).json({ error: 'Entry not found' })
      }
      return res.status(200).json(rows[0])
    } catch (err) {
      console.error('Error in fetchPageInfo:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }