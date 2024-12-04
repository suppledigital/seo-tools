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
  Fab,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function ContentHome() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
          })
          .catch((error) => console.error('Error fetching projects:', error));
      })
      .catch((error) => {
        console.error('Error adding project:', error);
        alert('Error adding project.');
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
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} mb={4}>
        <Typography variant="h4">Content Projects</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="subtitle1" mr={2}>
            Welcome, {session?.user?.email}
          </Typography>
          <IconButton onClick={() => router.push('/content/settings')}>
            <SettingsIcon />
          </IconButton>
          <Button variant="outlined" color="secondary" onClick={() => signOut()} size="small" sx={{ ml: 2 }}>
            Sign Out
          </Button>
        </Box>
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
          sx={{ ml: 2 }}
          onClick={() => setShowModal(true)}
        >
          Add Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.project_id}>
            <Box
              borderRadius={2}
              boxShadow={2}
              p={3}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              height="150px"
              bgcolor="#f9f9f9"
            >
              <Typography variant="h6" gutterBottom>
                {project.project_name}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                endIcon={<OpenInNewIcon />}
                onClick={() => handleProjectClick(project.project_id)}
              >
                Open
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setShowModal(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <AddIcon />
      </Fab>

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
        <Box position="fixed" top={0} left={0} width="100%" height="100%" display="flex" justifyContent="center" alignItems="center" bgcolor="rgba(255,255,255,0.7)" zIndex={1000}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
}
