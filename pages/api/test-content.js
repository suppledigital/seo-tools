// pages/api/test-content.js

export default function handler(req, res) {
    const fallbackHtml = `
      <h1>Hello from DB!</h1>
      <p>This content is preloaded in Hocuspocus using y-prosemirror.</p>
      <p>All devices see it immediately. Try opening multiple browsers!</p>
    `
    return res.status(200).json({ content: fallbackHtml })
  }
  