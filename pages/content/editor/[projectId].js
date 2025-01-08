// pages/content/editor/[projectId].js

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import CollaborationEditor from '../../../components/CollaborationEditor'

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
        .catch((err) => console.error('Error fetching project details:', err))
    }
  }, [status, projectId])

  // 2) Each time the user selects a different page, create a new doc + provider
  useEffect(() => {
    if (!projectId || !pages.length) return

    const currentPage = pages[selectedPageIndex]
    if (!currentPage) return

    const roomName = `project-${projectId}-page-${currentPage.entry_id}`
    const newDoc = new Y.Doc()
    const newProvider = new HocuspocusProvider({
      url: 'ws://localhost:1234',  // your Hocuspocus server
      name: roomName,
      document: newDoc,
    })

    setDoc(newDoc)
    setProvider(newProvider)

    return () => {
      newProvider.disconnect()
      newDoc.destroy()
    }
  }, [projectId, pages, selectedPageIndex])

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

  const currentPage = pages[selectedPageIndex] || {}
  // 3) fallbackHtml: if edited_content is empty, fallback to humanized_content
  const fallbackHtml = currentPage.edited_content?.trim()
    ? currentPage.edited_content
    : currentPage.humanized_content || ''
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
    <Box display="flex" height="100vh">
      {/* Left Sidebar */}
      <Box
        sx={{
          width: 260,
          borderRight: '1px solid #ddd',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddPage}
          color="primary"
          variant="outlined"
          sx={{ m: 1 }}
        >
          Add Page
        </Button>
      </Box>

      {/* Right side: The collaborative editor for the *selected* page */}
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

// 4) Disable SSR for Tiptap
export default dynamic(() => Promise.resolve(ProjectCollabEditor), { ssr: false })
