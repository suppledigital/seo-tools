// pages/content/editor/[projectId].js
import dynamic from 'next/dynamic'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useEffect, useState } from 'react'
import {
  Box, Button, CircularProgress, Typography, List, ListItem,
  ListItemButton, Divider, IconButton, AppBar, Toolbar
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import styles from './[projectId].module.css';

// Lazy-load your CollaborationEditor
const CollaborationEditor = dynamic(
  () => import('../../../components/CollaborationEditor'),
  { ssr: false },
)

function ProjectCollabEditor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { projectId } = router.query

  const [project, setProject] = useState(null)
  const [pages, setPages] = useState([])
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)
  const [doc, setDoc] = useState(null)
  const [provider, setProvider] = useState(null)

  // 1) Fetch project + pages from your Next.js API
  useEffect(() => {
    if (status === 'authenticated' && projectId) {
      axios
        .get(`/api/content/editor/projects/${projectId}`)
        .then((res) => {
          setProject(res.data.project)
          setPages(res.data.project.pages || [])
        })
        .catch(err => console.error('Error fetching project details:', err))
    }
  }, [status, projectId])

  // 2) On page selection, create doc + provider
  useEffect(() => {
    if (!projectId || !pages.length) return

    const currentPage = pages[selectedPageIndex]
    if (!currentPage) return

    const roomName = `project-${projectId}-page-${currentPage.entry_id}`
    console.log('[client] Creating doc =>', roomName)

    const newDoc = new Y.Doc()
    const newProvider = new HocuspocusProvider({
      url: 'ws://localhost:1234',
      name: roomName,
      document: newDoc,
      onConnect: () => {
        console.log('[client] Hocuspocus connected =>', roomName)
      },
    })

    setDoc(newDoc)
    setProvider(newProvider)

    return () => {
      newProvider.disconnect()
      newDoc.destroy()
    }
  }, [projectId, pages, selectedPageIndex])

  // loading states
  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }
  if (status === 'unauthenticated') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6">Please Sign In</Typography>
        <Button onClick={() => signIn('google')}>Sign In with Google</Button>
      </Box>
    )
  }
  if (!project) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  // 3) fallback if doc is empty
  const currentPage = pages[selectedPageIndex] || {}
  const fallbackHtml = currentPage.edited_content?.trim() || currentPage.humanized_content || ''

  const handleAddPage = () => {
    const nextId = pages.length ? pages.length + 1 : 1
    const newPage = {
      entry_id: nextId,
      title: `Page ${nextId}`,
      humanized_content: '',
      edited_content: '',
    }
    setPages([...pages, newPage])
    setSelectedPageIndex(pages.length)
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex' }} display="flex" className={styles.editorWindow}>
      {/* Left sidebar */}
      <Box sx={{ width: 260, borderRight: '1px solid #ddd', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" color="default" sx={{ p: 1 }}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => router.push('/content/editor')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 1 }}>
              {project.project_name || 'Project'}
            </Typography>
          </Box>
        </AppBar>

        <Box flexGrow={1} overflow="auto">
          <List>
            {pages.map((pg, index) => (
              <ListItem disablePadding key={pg.entry_id}>
                <ListItemButton
                  selected={index === selectedPageIndex}
                  onClick={() => setSelectedPageIndex(index)}
                >
                  <Typography variant="body1">{pg.title || `Page ${index + 1}`}</Typography>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        <Divider />
        <Button startIcon={<AddIcon />} onClick={handleAddPage} color="primary" variant="outlined" sx={{ m: 1 }}>
          Add Page
        </Button>
      </Box>

      {/* Right side: main editor */}
      <Box flexGrow={1} display="flex" flexDirection="column">
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Editing: {currentPage.title}</Typography>
        </Box>

        {!doc || !provider ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <CircularProgress />
          </Box>
        ) : (
          <CollaborationEditor
            key={currentPage.entry_id} // Force re-mount on page change
            doc={doc}
            provider={provider}
            userName={session?.user?.name || 'Unknown'}
            fallbackHtml={fallbackHtml}
          />
        )}
      </Box>
    </Box>
  )
}

export default dynamic(() => Promise.resolve(ProjectCollabEditor), { ssr: false })
