// pages/test-collab.jsx

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { CircularProgress, Box, Typography } from '@mui/material'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'

/**
 * Dynamically import the Tiptap-based component
 * that references Collaboration extension,
 * so we skip SSR for Tiptap code.
 */
const CollaborationEditor = dynamic(() => import('./testCollabEditor'), {
  ssr: false,
})

function TestCollabPage() {
  const [doc, setDoc] = useState(null)
  const [provider, setProvider] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 1) create a Y.Doc + HocuspocusProvider => "my-test-room"
    const ydoc = new Y.Doc()
    const hProvider = new HocuspocusProvider({
      url: 'ws://localhost:1234',
      name: 'my-test-room',
      document: ydoc,
    })

    setDoc(ydoc)
    setProvider(hProvider)
    setIsReady(true)

    // cleanup if page unmounts
    return () => {
      hProvider.disconnect()
      ydoc.destroy()
    }
  }, [])

  if (!isReady || !doc || !provider) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box p={2}>
        <Typography variant="h5">
          Server-based Preload Test
        </Typography>
        <Typography variant="body2" color="textSecondary">
          The content is loaded on the server. No local fallback needed.
        </Typography>
      </Box>

      <Box flexGrow={1} overflow="auto">
        <CollaborationEditor doc={doc} provider={provider} />
      </Box>
    </Box>
  )
}

// Also disable SSR for the page itself
export default dynamic(() => Promise.resolve(TestCollabPage), { ssr: false })
