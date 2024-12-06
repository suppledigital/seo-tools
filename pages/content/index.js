import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayoutAccountSidebar from '../../components/common/DashboardLayoutAccountSidebar';

export default function ContentHome() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const isAdmin = session?.user?.permissions_level === 'admin';

  useEffect(() => {
    const handleRouteChangeComplete = () => {
      setIsLoading(false);
    };
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);

  useEffect(() => {
    if (status === 'authenticated') {
      axios
        .get('/api/content/projects')
        .then((response) => {
          setProjects(response.data.projects);
          setFilteredProjects(response.data.projects);
        })
        .catch((error) => console.error('Error fetching projects:', error));
    }
  }, [status]);

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map((n) => n.charAt(0).toUpperCase()).join('');
    return initials[0];
  };

  const handleMenuOpen = (event, projectId) => {
    setAnchorEl(event.currentTarget);
    setSelectedProjectId(projectId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProjectId(null);
  };

  const deleteProject = async () => {
    handleMenuClose();
    const confirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await axios.delete(`/api/content/projects/${selectedProjectId}/delete`);
      if (response.status === 200) {
        setProjects(projects.filter((project) => project.project_id !== selectedProjectId));
        setFilteredProjects(filteredProjects.filter((project) => project.project_id !== selectedProjectId));
        toast.success('Project deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete the project.');
    }
  };

  const resetProjectData = async () => {
    handleMenuClose();
    const confirmed = window.confirm("Are you sure you want to reset this project's data?");
    if (!confirmed) return;

    try {
      const response = await axios.post(`/api/content/projects/${selectedProjectId}/reset-data`);
      if (response.status === 200) {
        toast.success('Project data reset successfully.');
      }
    } catch (error) {
      console.error('Error resetting project data:', error);
      toast.error('Failed to reset project data.');
    }
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    axios
      .post('/api/content/projects', { project_name: newProjectName })
      .then(() => {
        setShowModal(false);
        setNewProjectName('');
        axios
          .get('/api/content/projects')
          .then((response) => {
            setProjects(response.data.projects);
            setFilteredProjects(response.data.projects);
            toast.success('Project added successfully.');
          })
          .catch((error) => console.error('Error fetching projects:', error));
      })
      .catch((error) => {
        console.error('Error adding project:', error);
        toast.error('Error adding project.');
      });
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
    router.push(`/content/projects/${projectId}`);
  };

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
    <DashboardLayoutAccountSidebar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Content Projects
          </Typography>
          {/* Settings or other icons can go here if needed */}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search Projects"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
            onClick={() => setShowModal(true)}
          >
            Add Project
          </Button>
        </Box>

        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.project_id}>
              <Card sx={{ position: 'relative' }}>
                {(project.user_email === session.user.email || isAdmin) && (
                  <IconButton
                    aria-label="more"
                    aria-controls="long-menu"
                    aria-haspopup="true"
                    onClick={(e) => handleMenuOpen(e, project.project_id)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {project.project_name}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Chip
                      size="small"
                      avatar={<Avatar>{getInitials(project.name)}</Avatar>}
                      label={project.name || project.user_email}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleProjectClick(project.project_id)}
                    endIcon={<OpenInNewIcon />}
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={resetProjectData}>Reset Data</MenuItem>
          <MenuItem onClick={deleteProject}>Delete Project</MenuItem>
        </Menu>

        <Dialog open={showModal} onClose={() => setShowModal(false)}>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Project Name"
              variant="outlined"
              margin="normal"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleAddProject} variant="contained" color="primary">
              Add
            </Button>
          </DialogActions>
        </Dialog>

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
      </Container>

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
    </DashboardLayoutAccountSidebar>
  );
}
