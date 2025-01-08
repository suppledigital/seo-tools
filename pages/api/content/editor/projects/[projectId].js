import { getSession } from 'next-auth/react';
import pool from '../../../../../lib/db'; // adjust path if needed

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { projectId } = req.query;

  try {
    // 1) Fetch the project
    const [projectRows] = await pool.query(
      'SELECT * FROM projects WHERE project_id = ?',
      [projectId]
    );
    const project = projectRows[0];
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.method === 'GET') {
      // 2) Get all entries with both edited_content and humanized_content
      const [entries] = await pool.query(`
        SELECT 
          entry_id,
          url,
          meta_title,
          meta_description,
          page_type,
          content_type,
          humanized_content,
          edited_content
        FROM entries
        WHERE project_id = ${projectId}
        ORDER BY entry_id ASC
      `);

      // Build "pages" array (title can be "Page 1," "Page 2," etc.)
      let pageNumber = 1;
      const pages = entries.map((entry) => ({
        entry_id: entry.entry_id,
        title: `Page ${pageNumber++}`,
        // We will NOT set content here. We'll do it in front-end.
        humanized_content: entry.humanized_content || '',
        edited_content: entry.edited_content || '',
        url: entry.url || '',
        meta_title: entry.meta_title || '',
        meta_description: entry.meta_description || '',
        page_type: entry.page_type || '',
        content_type: entry.content_type || '',
      }));

      return res.status(200).json({
        project: {
          project_id: project.project_id,
          project_name: project.project_name,
          user_email: project.user_email,
          pages,
        },
      });
    }

    if (req.method === 'PUT') {
      // Saving to edited_content
      const { pages } = req.body;

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
            page.content,  // Quill HTML
            page.url,
            page.meta_title,
            page.meta_description,
            page.page_type,
            page.content_type,
            page.entry_id,
            projectId,
          ]
        );
      }

      return res.status(200).json({ message: 'Project content updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in editor [projectId] handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
