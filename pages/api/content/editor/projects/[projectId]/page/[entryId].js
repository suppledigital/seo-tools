// pages/api/content/editor/projects/[projectId]/page/[entryId].js

import { getSession } from 'next-auth/react'
import pool from '../../../../../../../lib/db' // adjust path if needed

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { projectId, entryId } = req.query

  try {
    // Validate project
    const [projectRows] = await pool.query(
      'SELECT * FROM projects WHERE project_id = ?',
      [projectId],
    )
    const project = projectRows[0]
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Validate that entry belongs to project
    const [entryRows] = await pool.query(
      'SELECT * FROM entries WHERE project_id = ? AND entry_id = ?',
      [projectId, entryId],
    )
    const entry = entryRows[0]
    if (!entry) {
      return res
        .status(404)
        .json({ error: `Entry ${entryId} not found in project ${projectId}` })
    }

    if (req.method === 'GET') {
      // Optional: return data for a single page
      return res.status(200).json({
        entry_id: entry.entry_id,
        url: entry.url || '',
        meta_title: entry.meta_title || '',
        meta_description: entry.meta_description || '',
        page_type: entry.page_type || '',
        content_type: entry.content_type || '',
        humanized_content: entry.humanized_content || '',
        edited_content: entry.edited_content || '',
      })
    }

    if (req.method === 'PUT') {
      // "Save" single page
      const {
        content,
        url,
        meta_title,
        meta_description,
        page_type,
        content_type,
      } = req.body

      // you can add more validations if needed

      await pool.query(
        `
        UPDATE entries
        SET
          edited_content = ?,
          url = ?,
          meta_title = ?,
          meta_description = ?,
          page_type = ?,
          content_type = ?
        WHERE project_id = ? AND entry_id = ?
        `,
        [
          content, // The new HTML/text
          url || '',
          meta_title || '',
          meta_description || '',
          page_type || '',
          content_type || '',
          projectId,
          entryId,
        ],
      )

      return res.status(200).json({ message: 'Page updated successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error(`Error in single page handler:`, err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
