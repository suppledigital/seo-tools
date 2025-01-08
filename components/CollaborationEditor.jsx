// components/CollaborationEditor.jsx

import React from 'react'
import { Box } from '@mui/material'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

export default function CollaborationEditor({ doc, provider, userName, fallbackHtml }) {
  // 1) We define Tiptap in one step:
  //    content: fallbackHtml
  console.log(fallbackHtml);
  const editor = useEditor({
    content: fallbackHtml || '',
    extensions: [
      StarterKit,
      Collaboration.configure({ document: doc }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName,
          color: '#' + ((Math.random() * 0xffffff) << 0).toString(16),
        },
      }),
    ],
    autofocus: true,
  })

  if (!editor) {
    return <div>Loading Editor...</div>
  }

  return (
    <Box flexGrow={1} overflow="auto">
      <EditorContent editor={editor} style={{ padding: 16 }} />
    </Box>
  )
}
