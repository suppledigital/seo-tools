import dynamic from 'next/dynamic'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { useEffect, useState, useRef } from 'react'
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
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Drawer,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import HistoryIcon from '@mui/icons-material/History'
import styles from './[projectId].module.css'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'

// Icons for pin/close
import PushPinIcon from '@mui/icons-material/PushPin'
import CloseIcon from '@mui/icons-material/Close'

// Dynamically load your Tiptap collaboration editor
const CollaborationEditorWithVersions = dynamic(
  () => import('../../../components/CollaborationEditorWithVersions'),
  { ssr: false },
)

function ProjectCollabEditor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { projectId } = router.query

  // Project + page data
  const [project, setProject] = useState(null)
  const [pages, setPages] = useState([])
  const [selectedPageIndex, setSelectedPageIndex] = useState(0)

  // Y.js doc + provider for real-time
  const [doc, setDoc] = useState(null)
  const [provider, setProvider] = useState(null)

  // Presence doc + provider for presence awareness
  const [presenceDoc, setPresenceDoc] = useState(null)
  const [presenceProvider, setPresenceProvider] = useState(null)
  const [pageMap, setPageMap] = useState({})

  // Right sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /**
   * Sidebar tabs:
   *  0 => Project Info
   *  1 => Page Info
   *  2 => Keywords
   */
  const [sidebarTab, setSidebarTab] = useState(0)

  // For toggling “client info”
  const [showClientInfo, setShowClientInfo] = useState(false)

  // If pinned is true, we keep the sidebar open even if "Show Client Info" is turned off
  const [sidebarPinned, setSidebarPinned] = useState(false)

  // Caching states for the 3 tabs
  const [projectInfo, setProjectInfo] = useState(null) // From `projects`
  const [pageInfo, setPageInfo] = useState(null)       // From `entries`
  const [keywordInfo, setKeywordInfo] = useState(null) // From `main_projects` + `keywords`

  // History / Version Menu
  const [anchorEl, setAnchorEl] = useState(null)
  const openHistoryMenu = Boolean(anchorEl)

  // Dialog for creating version
  const [openVersionDialog, setOpenVersionDialog] = useState(false)
  const versionNameRef = useRef()

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

  // Update presence (which page user is on)
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

  // If the user is not logged in or data not loaded
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
        <Typography variant="h6" sx={{ mr: 2 }}>Please Sign In</Typography>
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

  // Helpers
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

  // HISTORY / VERSIONS MENU
  const handleOpenHistoryMenu = (event) => setAnchorEl(event.currentTarget)
  const handleCloseHistoryMenu = () => setAnchorEl(null)

  const handleOpenVersionDialog = () => {
    setOpenVersionDialog(true)
    handleCloseHistoryMenu()
  }
  const handleCloseVersionDialog = () => setOpenVersionDialog(false)
  const handleCreateVersionDialog = () => {
    const versionName = versionNameRef.current?.value?.trim() || 'Untitled'
    // e.g. call an API or do a Hocuspocus stateless message
    alert(`Created version "${versionName}"!`)
    setOpenVersionDialog(false)
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // **Handle tab changes in the sidebar**
  const handleSidebarTabChange = async (event, newValue) => {
    setSidebarTab(newValue)

    // 0 => Project Info
    if (newValue === 0 && !projectInfo && projectId) {
      try {
        const { data } = await axios.get(
          `/api/content/editor/fetchProjectInfo?projectId=${projectId}`
        )
        setProjectInfo(data)
      } catch (err) {
        console.error(err)
      }
    }
    // 1 => Page Info
    else if (newValue === 1 && !pageInfo && currentPage.entry_id) {
      try {
        const { data } = await axios.get(
          `/api/content/editor/fetchPageInfo?entryId=${currentPage.entry_id}`
        )
        setPageInfo(data)
      } catch (err) {
        console.error(err)
      }
    }
    // 2 => Keywords
    else if (newValue === 2 && !keywordInfo && projectId) {
      try {
        const { data } = await axios.get(
          `/api/content/editor/fetchKeywordInfo?projectId=${projectId}`
        )
        setKeywordInfo(data)
      } catch (err) {
        console.error(err)
      }
    }
  }

  // For the “Show Client Info” toggle
  const handleClientInfoToggle = async (event) => {
    const checked = event.target.checked
    setShowClientInfo(checked)

    if (checked) {
      // Open the sidebar, show Project Info tab first
      setSidebarOpen(true)
      setSidebarTab(0)

      // If we haven't yet fetched the project info, do so
      if (!projectInfo && projectId) {
        try {
          const { data } = await axios.get(
            `/api/content/editor/fetchProjectInfo?projectId=${projectId}`
          )
          setProjectInfo(data)
        } catch (err) {
          console.error(err)
        }
      }
    } else {
      // If pinned is false, close the sidebar
      if (!sidebarPinned) {
        setSidebarOpen(false)
      }
    }
  }

  // Pin or unpin the sidebar
  const handlePinSidebar = () => {
    setSidebarPinned(!sidebarPinned)
  }

  // Close sidebar explicitly
  const handleCloseSidebar = () => {
    if (!sidebarPinned) {
      setSidebarOpen(false)
      setShowClientInfo(false)
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex' }} className={styles.editorWindow}>
      {/* Left sidebar (Pages) */}
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
                      {pg.title || `Page ${index + 1}`}{' '}
                      <small>({pg.entry_id})</small>
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

      {/* Main editor area */}
      <Box flexGrow={1} display="flex" flexDirection="column">
        {/* Top area with project details & toggles */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid #ddd',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6">
              Editing: {currentPage.title}{' '}
              <small>(ID: {currentPage.entry_id})</small>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              URL: {currentPage.url} <br />
              Keywords: {currentPage.primary_keyword} {currentPage.secondary_keyword}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Toggle “Client Info” => triggers sidebar with Project Info tab */}
            <FormControlLabel
              control={
                <Switch
                  checked={showClientInfo}
                  onChange={handleClientInfoToggle}
                />
              }
              label="Show Client Info"
            />

            {/* History / Versions icon + dropdown */}
            <Tooltip title="Version / History">
              <IconButton onClick={handleOpenHistoryMenu}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={openHistoryMenu}
              onClose={handleCloseHistoryMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleOpenVersionDialog}>Create Version</MenuItem>
              <MenuItem onClick={toggleSidebar}>All Versions</MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* The main collaboration editor */}
        {!doc || !provider ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <CircularProgress />
          </Box>
        ) : (
          <CollaborationEditorWithVersions
            key={`${currentPage.entry_id}-${doc.guid}`} // re-init if doc changes
            doc={doc}
            provider={provider}
            projectId={projectId}
            entryId={currentPage.entry_id}
            userName={session?.user?.name || 'Unknown'}
            fallbackHtml={fallbackHtml}
          />
        )}
      </Box>

      {/* Right Sidebar (persistent) with 3 tabs:
          0 => Project Info, 1 => Page Info, 2 => Keywords */}
      <Drawer
        variant="persistent"
        anchor="right"
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        PaperProps={{ sx: { width: 400, p: 2, flexShrink: 0,   zIndex:9999,          [`& .MuiDrawer-paper`]: { width: 400, boxSizing: 'border-box' },} }}
      >
        {/* Header with pin/close icons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={sidebarPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}>
              <IconButton onClick={handlePinSidebar}>
                <PushPinIcon color={sidebarPinned ? 'primary' : 'inherit'} />
              </IconButton>
            </Tooltip>
          </Box>
          {!sidebarPinned && (
            <IconButton onClick={handleCloseSidebar}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        <Tabs value={sidebarTab} onChange={handleSidebarTabChange} variant="fullWidth">
          <Tab label="Project Info" />
          <Tab label="Page Info" />
          <Tab label="Keywords" />
        </Tabs>

        <Box sx={{ mt: 2, overflowY: 'auto', flexGrow: 1 }}>
            {/* TAB 0 => Project Info */}
            {sidebarTab === 0 && (
                <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Project Information
                </Typography>
                {!projectInfo ? (
                    <Typography>Loading or not fetched yet...</Typography>
                ) : (
                    <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardHeader title={`Project ID: ${projectInfo.project_id}`} />
                    <CardContent>
                        <Typography variant="body2">
                        <b>Project Name</b>: {projectInfo.project_name || 'N/A'}
                        </Typography>
                       
                        <Typography variant="body2">
                        <b>Business Name</b>: {projectInfo.business_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                        <b>Phone Number</b>: {projectInfo.phone_number || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                         <b> Physical Location</b>: {projectInfo.physical_location || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Services/Products</b>: {projectInfo.services_products || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Primary USP</b>: {projectInfo.primary_usp || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Secondary USP</b>: {projectInfo.secondary_usp || 'N/A'}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Target Locations</b>: {projectInfo.target_locations || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                        <b>Tone</b>: {projectInfo.tone || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Additional Notes</b>: {projectInfo.additional_notes || 'N/A'}
                        </Typography>
                       
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Primary CTA</b>: {projectInfo.primary_cta || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Secondary CTA</b>: {projectInfo.secondary_cta || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Trust Signals</b>: {projectInfo.trust_signals || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <b>Awards/Accreditations</b>: {projectInfo.awards_accreditations || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                        <b>Language</b>: {projectInfo.language || 'N/A'}
                        </Typography>
                      
                    </CardContent>
                    </Card>
                )}
                </Box>
            )}

          {/* TAB 1 => Page Info */}
        {sidebarTab === 1 && (
            <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
                Page Information
            </Typography>
            {!pageInfo ? (
                <Typography>Loading or not fetched yet...</Typography>
            ) : (
                <Card variant="outlined" sx={{ mb: 2 }}>
                <CardHeader title={`Entry #${pageInfo.entry_id}`} />
                <CardContent>
                    <Typography variant="body2">
                    <b>Project ID</b>: {pageInfo.project_id}
                    </Typography>
                    <Typography variant="body2">
                    <b>URL</b>: {pageInfo.url}
                    </Typography>

                    <Typography variant="body2">
                    <b>Rephrasy Score (Humanise)</b>: {pageInfo.rephrasy_score_humanise ?? 'N/A'}
                    </Typography>

                    <Typography variant="body2">
                    <b>Primary Keyword</b>: {pageInfo.primary_keyword || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <b>Secondary Keyword</b>: {pageInfo.secondary_keyword || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2">
                    <b>Page Type</b>: {pageInfo.page_type || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                    <b>Content Type</b>: {pageInfo.content_type || 'N/A'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <b>LSI Terms</b>: {pageInfo.lsi_terms || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <b>PAA Terms</b>: {pageInfo.paa_terms || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <b>Topic Cluster</b>: {pageInfo.topic_cluster || 'N/A'}
                    </Typography>
                   
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <b>Existing Product Info</b>: {pageInfo.existing_product_info || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    <b>Brand Terms</b>: {pageInfo.brand_terms || 'N/A'}
                    </Typography>
                    
                   
                   
                    
                </CardContent>
                </Card>
            )}
            </Box>
        )}


         {/* TAB 2 => Keyword Info */}
            {sidebarTab === 2 && (
                <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Keyword Information
                </Typography>
                {!keywordInfo ? (
                    <Typography>Loading or not fetched yet...</Typography>
                ) : (
                    <>
                    {/* Main project info */}
                    <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardHeader
                        title={`Main Project: ${
                            keywordInfo?.main_project?.project_name || 'N/A'
                        }`}
                        />
                        <CardContent>
                        <Typography variant="body2">
                            Project ID: {keywordInfo?.main_project?.project_id ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Number of Keywords: {keywordInfo?.main_project?.number_of_keywords ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Created At: {keywordInfo?.main_project?.created_at || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Updated At: {keywordInfo?.main_project?.updated_at || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Today Avg: {keywordInfo?.main_project?.today_avg ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Yesterday Avg: {keywordInfo?.main_project?.yesterday_avg ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Total Up: {keywordInfo?.main_project?.total_up ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Total Down: {keywordInfo?.main_project?.total_down ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Top 5: {keywordInfo?.main_project?.top5 ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Top 10: {keywordInfo?.main_project?.top10 ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Top 30: {keywordInfo?.main_project?.top30 ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Visibility: {keywordInfo?.main_project?.visibility ?? 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                            Visibility %: {keywordInfo?.main_project?.visibility_percent ?? 'N/A'}
                        </Typography>
                        </CardContent>
                    </Card>

                    {/* Keyword cards */}
                    {(keywordInfo.keywords || []).map((kw) => (
                        <Card variant="outlined" key={kw.id} sx={{ mb: 2 }}>
                        <CardHeader title={`Keyword: ${kw.keyword}`} />
                        <CardContent>
                            <Typography variant="body2">
                            ID: {kw.id}
                            </Typography>
                            <Typography variant="body2">
                            Keyword ID: {kw.keyword_id}
                            </Typography>
                            <Typography variant="body2">
                            Project ID: {kw.project_id}
                            </Typography>
                            <Typography variant="body2">
                            Search Engine ID: {kw.search_engine_id}
                            </Typography>
                            <Typography variant="body2">
                            Current Ranking: {kw.current_ranking ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            Previous Ranking: {kw.previous_ranking ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            Ranking URL: {kw.ranking_url || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            Created At: {kw.created_at || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            Updated At: {kw.updated_at || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            pos: {kw.pos ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            change_value: {kw.change_value ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            is_map: {String(kw.is_map ?? 'N/A')}
                            </Typography>
                            <Typography variant="body2">
                            map_position: {kw.map_position ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            volume: {kw.volume ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            competition: {kw.competition ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            suggested_bid: {kw.suggested_bid ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            kei: {kw.kei ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            total_sum: {kw.total_sum ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            landing_pages_json: {JSON.stringify(kw.landing_pages_json) || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            features_json: {JSON.stringify(kw.features_json) || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            paid_position: {kw.paid_position ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            cpc: {kw.cpc ?? 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                            results: {kw.results ?? 'N/A'}
                            </Typography>
                        </CardContent>
                        </Card>
                    ))}
                    </>
                )}
                </Box>
            )}
            </Box>
      </Drawer>

      {/* Create Version Dialog */}
      <Dialog open={openVersionDialog} onClose={handleCloseVersionDialog}>
        <DialogTitle>Create a Version</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={versionNameRef}
            label="Version Name"
            variant="outlined"
            fullWidth
            autoFocus
            defaultValue="My Version"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVersionDialog}>Cancel</Button>
          <Button onClick={handleCreateVersionDialog} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default dynamic(() => Promise.resolve(ProjectCollabEditor), { ssr: false })
