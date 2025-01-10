// pages/api/content/editor/projects/[projectId]/page/[entryId]/versions.js

import { getSession } from 'next-auth/react'
import pool from '../../../../../../../../lib/db'

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { projectId, entryId } = req.query

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(`
        SELECT id, version_name, created_at
        FROM page_versions
        WHERE project_id=? AND entry_id=?
        ORDER BY id DESC
      `, [projectId, entryId])

      return res.status(200).json({ versions: rows })
    } catch (err) {
      console.error('Error fetching versions =>', err)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
