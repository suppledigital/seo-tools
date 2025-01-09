// pages/api/content/editor/projects/[projectId]/index.js

import { getSession } from 'next-auth/react'
import pool from '../../../../../lib/db' // adjust if needed

export default async function handler(req, res) {
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { projectId } = req.query

  try {
    // 1) Check if the project exists
    const [projectRows] = await pool.query(
      'SELECT * FROM projects WHERE project_id = ?',
      [projectId],
    )
    const project = projectRows[0]
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (req.method === 'GET') {
      // Fetch all entries for this project
      const [entries] = await pool.query(
        `SELECT
           entry_id,
           url,
           meta_title,
           meta_description,
           page_type,
           content_type,
           humanized_content,
           edited_content
         FROM entries
         WHERE project_id = ?
         ORDER BY entry_id ASC`,
        [projectId],
      )

      let pageNumber = 1
      const pages = entries.map((entry) => ({
        entry_id: entry.entry_id,
        title: `Page ${pageNumber++}`,
        url: entry.url || '',
        meta_title: entry.meta_title || '',
        meta_description: entry.meta_description || '',
        page_type: entry.page_type || '',
        content_type: entry.content_type || '',
        humanized_content: entry.humanized_content || '',
        edited_content: entry.edited_content || '',
      }))

      return res.status(200).json({
        project: {
          project_id: project.project_id,
          project_name: project.project_name,
          user_email: project.user_email,
          pages,
        },
      })
    }

    if (req.method === 'PUT') {
      // "Save All": Updates multiple pages
      const { pages } = req.body
      if (!Array.isArray(pages)) {
        return res
          .status(400)
          .json({ error: 'Expected "pages" array in request body' })
      }

      for (const page of pages) {
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
            WHERE entry_id = ? AND project_id = ?
          `,
          [
            page.content, // The HTML or text from your editor
            page.url,
            page.meta_title,
            page.meta_description,
            page.page_type,
            page.content_type,
            page.entry_id,
            projectId,
          ],
        )
      }

      return res
        .status(200)
        .json({ message: 'All pages updated successfully' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Error in [projectId] handler:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
