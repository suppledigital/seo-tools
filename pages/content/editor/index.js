import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  List,
  ListItem,
  Link,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EditorHome() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMenuOpen = (event, projectId) => {
    setAnchorEl(event.currentTarget);
    setSelectedProjectId(projectId);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProjectId(null);
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setFilteredProjects(
      projects.filter((project) =>
        project.project_name.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  const handleProjectClick = (projectId) => {
    if (isLoading) return;
    setIsLoading(true);
    router.push(`/content/editor/${projectId}`);
  };

  // Fallback initials if no image is available
  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map((n) => n.charAt(0).toUpperCase()).join('');
    return initials;
  };

  // Fetch projects on mount (if authenticated)
  useEffect(() => {
    if (status === 'authenticated') {
      axios
        .get('/api/content/editor/projects')
        .then((res) => {
          setProjects(res.data.projects);
          setFilteredProjects(res.data.projects);
        })
        .catch((err) => {
          console.error('Error fetching editor projects:', err);
          toast.error('Failed to fetch projects');
        });
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="sm">
        <Typography variant="h4" align="center" gutterBottom>
          Please Sign In
        </Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" color="primary" onClick={() => signIn('google')}>
            Sign in with Google
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container fixed sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Editor - Projects
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search Projects"
          value={searchQuery}
          onChange={handleSearch}
        />

        <Box display="flex" alignItems="center" ml={2}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange}>
            <ToggleButton value="grid">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
            onClick={() => toast.info('Add Project not implemented in Editor!')}
          >
            Add Project
          </Button>
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={3} key={project.project_id}>
              <Card sx={{ position: 'relative' }}>
                <IconButton
                  aria-label="more"
                  aria-controls="long-menu"
                  aria-haspopup="true"
                  onClick={(e) => handleMenuOpen(e, project.project_id)}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <MoreVertIcon />
                </IconButton>

                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {project.project_name}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Chip
                      size="small"
                      avatar={
                        <Avatar
                          src={session?.user?.image || ''}
                          alt={session?.user?.name || 'User Avatar'}
                        >
                          {!session?.user?.image &&
                            getInitials(session?.user?.name || '')}
                        </Avatar>
                      }
                      label={session?.user?.name || 'Unknown user'}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => handleProjectClick(project.project_id)}
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <List>
          {filteredProjects.map((project) => (
            <ListItem
              key={project.project_id}
              sx={{
                mb: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
                '&:hover': { backgroundColor: '#ededed' },
              }}
            >
              <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" sx={{ ml: 2, fontWeight: 500 }}>
                    <Link
                      underline="hover"
                      onClick={() => handleProjectClick(project.project_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {project.project_name}
                    </Link>
                  </Typography>
                  <Chip
                    size="small"
                    sx={{ ml: 2 }}
                    avatar={
                      <Avatar
                        src={session?.user?.image || ''}
                        alt={session?.user?.name || 'User Avatar'}
                      >
                        {!session?.user?.image &&
                          getInitials(session?.user?.name || '')}
                      </Avatar>
                    }
                    label={session?.user?.name || 'Unknown user'}
                  />
                </Box>
                <Box>
                  <Button
                    size="small"
                    color="primary"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => handleProjectClick(project.project_id)}
                  >
                    Open
                  </Button>
                  <IconButton
                    aria-label="more"
                    aria-controls="long-menu"
                    aria-haspopup="true"
                    onClick={(e) => handleMenuOpen(e, project.project_id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => toast.info('Reset Data not implemented in Editor!')}>
          Reset Data
        </MenuItem>
        <MenuItem onClick={() => toast.info('Delete Project not implemented in Editor!')}>
          Delete Project
        </MenuItem>
      </Menu>

      {isLoading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="rgba(255,255,255,0.7)"
          zIndex={1000}
        >
          <CircularProgress />
        </Box>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Container>
  );
}
