// pages/api/content/projects/[projectId]/export-to-google-docs.js

import { google } from 'googleapis';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });

    if (!session || !session.user.accessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { projectId } = req.query;

    const accessToken = session.user.accessToken;

    // Create an OAuth2 client with the access token
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    // Fetch entries from the database
    const pool = (await import('../../../../../lib/db')).default;

    // Fetch the project to get the project name
    const [projectRows] = await pool.query('SELECT * FROM projects WHERE project_id = ?', [projectId]);
    const project = projectRows[0];

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const projectName = project.project_name || `Project ${projectId}`;

    const [entries] = await pool.query('SELECT * FROM entries WHERE project_id = ?', [projectId]);

    // Build the document content
    const requests = [];
    let index = 1; // Document index starts at 1
    let pageNumber = 1; // Page number starts at 1

    for (const entry of entries) {
      const contentItems = [
        { text: `Page ${pageNumber}\n`, bold: true },
        { text: `Meta Title: ${entry.meta_title || ''}\n`, italic: true },
        { text: `Meta Description: ${entry.meta_description || ''}\n\n`, italic: true },
        { text: `Page Type: ${entry.page_type || ''}\n` },
        { text: `Content Type: ${entry.content_type || ''}\n\n` },
        { text: `Keywords:\n` },
        { text: `Primary keyword: ${entry.primary_keyword || ''}\n`, bold: true },
        { text: `Secondary keywords: ${entry.secondary_keyword || ''}\n\n` },
        { text: `Content:\n`, bold: true }, // Bold "Content:" label
      ];

      // Process the generated content
      const contentLines = (entry.generated_content || '').split('\n');
      let i = 0;
      while (i < contentLines.length) {
        let line = contentLines[i];
        const trimmedLine = line.trim();

        // Check for bullet point starters
        const bulletSymbols = ['*', '-', '•'];
        if (bulletSymbols.some((symbol) => trimmedLine.startsWith(symbol))) {
          const bulletSymbol = bulletSymbols.find((symbol) => trimmedLine.startsWith(symbol));
          const bulletLines = [];

          // Collect consecutive bullet lines
          while (
            i < contentLines.length &&
            contentLines[i].trim().startsWith(bulletSymbol)
          ) {
            bulletLines.push(contentLines[i].trim().substring(1).trim());
            i++;
          }

          // Only format as bullet list if there are at least two items
          if (bulletLines.length >= 2) {
            // Add bullet list to contentItems
            for (const bulletText of bulletLines) {
              contentItems.push({
                text: bulletText + '\n',
                bullet: true,
              });
            }
          } else {
            // Not enough items for a list, add lines as normal text
            for (const bulletText of bulletLines) {
              contentItems.push({
                text: bulletSymbol + ' ' + bulletText + '\n',
              });
            }
          }
        } else {
          // Regular line
          let isBold = false;
          const headingPattern = /^(H[1-6]:|Heading [1-6]:)/i;
          if (headingPattern.test(trimmedLine)) {
            isBold = true;
          }
          contentItems.push({
            text: line + '\n',
            bold: isBold,
          });
          i++;
        }
      }

      // Add a newline after the content
      contentItems.push({ text: '\n' });

      // Now, construct the requests for the current entry
      for (const item of contentItems) {
        const startIndex = index;
        const endIndex = startIndex + item.text.length;

        // Insert the text
        requests.push({
          insertText: {
            location: { index: startIndex },
            text: item.text,
          },
        });

        // Apply text styles if needed
        if (item.bold || item.italic || item.bullet) {
          const textStyleFields = [];
          const textStyle = {};

          if (item.bold) {
            textStyle.bold = true;
            textStyleFields.push('bold');
          }
          if (item.italic) {
            textStyle.italic = true;
            textStyleFields.push('italic');
          }

          if (textStyleFields.length > 0) {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: startIndex,
                  endIndex: endIndex,
                },
                textStyle: textStyle,
                fields: textStyleFields.join(','),
              },
            });
          }

          // Handle bullet points
          if (item.bullet) {
            requests.push({
              createParagraphBullets: {
                range: {
                  startIndex: startIndex,
                  endIndex: endIndex - 1, // Exclude the newline character
                },
                bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
              },
            });
          }
        }

        index = endIndex;
      }

      pageNumber += 1; // Increment the page number for the next entry
    }

    // Create the document
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    const doc = await docs.documents.create({
      requestBody: {
        title: projectName,
      },
    });

    // Batch update the document with the requests
    await docs.documents.batchUpdate({
      documentId: doc.data.documentId,
      requestBody: {
        requests: requests,
      },
    });

    // Set permissions
    const userEmail = session.user.email;
    const domain = userEmail.substring(userEmail.indexOf('@') + 1);

    // Grant edit access to users in the same domain
    await drive.permissions.create({
      fileId: doc.data.documentId,
      requestBody: {
        type: 'domain',
        role: 'writer',
        domain: domain,
      },
    });

    // Grant comment access to anyone with the link
    await drive.permissions.create({
      fileId: doc.data.documentId,
      requestBody: {
        type: 'anyone',
        role: 'commenter',
      },
    });

    // Ensure link-sharing is enabled
    await drive.files.update({
      fileId: doc.data.documentId,
      requestBody: {
        // Optionally, you can set the 'Anyone with the link' sharing setting here
      },
    });

    // Construct the document URL
    const documentUrl = `https://docs.google.com/document/d/${doc.data.documentId}/edit`;

    res.status(200).json({ documentUrl });
  } catch (error) {
    console.error('Error exporting to Google Docs:', error);

    if (error.response && error.response.status === 401) {
      // Token might have expired or invalid, prompt re-authentication
      res.status(401).json({ message: 'Unauthorized' });
    } else {
      res.status(500).json({ message: 'Error exporting to Google Docs.' });
    }
  }
}
