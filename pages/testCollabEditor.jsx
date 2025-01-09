// pages/testCollabEditor.jsx

import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { Box } from '@mui/material'

export default function TestCollabEditor({ doc, provider }) {
  const editor = useEditor({
    // We do not pass content here. The doc from the server is our single source of truth.
    extensions: [
      StarterKit.configure({ history: false }), // remove history to avoid the warning
      Collaboration.configure({
        document: doc,
        // field: 'root',  // default is 'root', so no override needed unless you changed it
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: 'TestUser',
          color: '#ffcc00',
        },
      }),
    ],
    autofocus: true,
    // Possibly help Tiptap hush the SSR messages
    editorProps: {
      immediatelyRender: false,
    },
  })

  // debug logs
  useEffect(() => {
    if (!editor) return
    const handler = () => {
      console.log('Editor updated =>', editor.getHTML())
    }
    editor.on('update', handler)

    return () => {
      editor.off('update', handler)
    }
  }, [editor])

  if (!editor) {
    return <div>Loading Editor…</div>
  }

  return (
    <Box p={2} overflow="auto" height="100%">
      <EditorContent editor={editor} />
    </Box>
  )
}
