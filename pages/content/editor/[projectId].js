import dynamic from 'next/dynamic'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useEffect, useState } from 'react'
import {
  Box, Button, CircularProgress, Typography, List, ListItem,
  ListItemButton, Divider, IconButton, AppBar, Avatar
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import styles from './[projectId].module.css'

const CollaborationEditorWithVersions = dynamic(
  () => import('../../../components/CollaborationEditorWithVersions'),
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

  const [presenceDoc, setPresenceDoc] = useState(null)
  const [presenceProvider, setPresenceProvider] = useState(null)
  const [pageMap, setPageMap] = useState({})

  // 1) Fetch project + pages
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

  // 2) On page selection => new doc + provider
  useEffect(() => {
    if (!projectId || !pages.length) return

    const currentPage = pages[selectedPageIndex]
    if (!currentPage) return

    const roomName = `project-${projectId}-page-${currentPage.entry_id}`
    console.log('[client] Creating doc =>', roomName)

    const newDoc = new Y.Doc()
    const newProvider = new HocuspocusProvider({
      url: 'wss://sync.supple.tools',
      name: roomName,
      document: newDoc,
      onConnect: () => {
        console.log('[client] Hocuspocus connected =>', roomName)
      },
    })

    setDoc(newDoc)
    setProvider(newProvider)

    return () => {
      console.log('[client] Unmount doc =>', roomName)
      newProvider.awareness.setLocalState(null)
      newProvider.disconnect()
      newDoc.destroy()
    }
  }, [projectId, pages, selectedPageIndex])

  // Presence doc
  useEffect(() => {
    if (!projectId) return

    const pDoc = new Y.Doc()
    const pProvider = new HocuspocusProvider({
      url: 'wss://sync.supple.tools',
      name: `project-${projectId}-presence`,
      document: pDoc,
      onConnect: () => {
        console.log(`[presence] connected => project-${projectId}-presence`)
      },
    })

    setPresenceDoc(pDoc)
    setPresenceProvider(pProvider)

    return () => {
      pProvider.disconnect()
      pDoc.destroy()
    }
  }, [projectId])

  // Update presence
  useEffect(() => {
    if (!presenceProvider || !pages.length) return
    const currentPage = pages[selectedPageIndex]
    if (!currentPage) return

    presenceProvider.awareness.setLocalStateField('userInfo', {
      userId: session?.user?.id,
      userName: session?.user?.name,
      userImage: session?.user?.image,
      pageId: currentPage.entry_id,
    })
  }, [presenceProvider, selectedPageIndex, pages])

  // Build pageMap => pageId => array of { userId, userName, userImage }
  useEffect(() => {
    if (!presenceProvider) return

    const aw = presenceProvider.awareness

    const handlePresenceChange = () => {
      const states = Array.from(aw.getStates().values())
      const newMap = {}
      for (const st of states) {
        const ui = st.userInfo
        if (!ui || !ui.pageId) continue
        if (!newMap[ui.pageId]) newMap[ui.pageId] = []
        newMap[ui.pageId].push({
          userId: ui.userId,
          userName: ui.userName,
          userImage: ui.userImage,
        })
      }
      setPageMap(newMap)
    }

    aw.on('change', handlePresenceChange)
    handlePresenceChange()

    return () => {
      aw.off('change', handlePresenceChange)
    }
  }, [presenceProvider])

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
            {pages.map((pg, index) => {
              const theseEditors = pageMap[pg.entry_id] || []
              return (
                <ListItem disablePadding key={`page-${pg.entry_id}-${index}`}>
                  <ListItemButton
                    selected={index === selectedPageIndex}
                    onClick={() => setSelectedPageIndex(index)}
                  >
                    <Typography variant="body1">
                      {pg.title || `Page ${index + 1}`} <small>{pg.entry_id}</small>
                    </Typography>

                    {theseEditors.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        {theseEditors.map((u, idx2) => (
                          <Avatar
                            key={`presence-${u.userId}-${idx2}`}
                            src={u.userImage}
                            alt={u.userName}
                            sx={{ width: 24, height: 24 }}
                          />
                        ))}
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
              )
            })}
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
          <Typography variant="h6">
            Editing: {currentPage.title} <small>(Page ID: {currentPage.entry_id})</small>
          </Typography>
          <Typography variant="body1">URL: {currentPage.url}</Typography>
          <Typography variant="body1">
            Keywords: {currentPage.primary_keyword} {currentPage.secondary_keyword}
          </Typography>
        </Box>

        {!doc || !provider ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <CircularProgress />
          </Box>
        ) : (
          <CollaborationEditorWithVersions
             key={`${currentPage.entry_id}-${doc.guid}`} // fix
             doc={doc}
            provider={provider}
            projectId={projectId}
            entryId={currentPage.entry_id}
            userName={session?.user?.name || 'Unknown'}
            fallbackHtml={fallbackHtml}
          />
        )}
      </Box>
    </Box>
  )
}

export default dynamic(() => Promise.resolve(ProjectCollabEditor), { ssr: false })
