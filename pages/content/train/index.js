import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';

const TrainContent = () => {
  const [queryType, setQueryType] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [generatedResponses, setGeneratedResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [projectInfo, setProjectInfo] = useState({});

  useEffect(() => {
    // Fetch projects from API
    axios
      .get('/api/content/projects')
      .then((response) => {
        setProjects(response.data.projects || []);
        setLoadingProjects(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingProjects(false);
      });
  }, []);

  const handleGenerate = async () => {
    if (!queryType || !selectedProject) {
      alert('Please select a query type and project.');
      return;
    }

    setLoadingSamples(true);
    setGeneratedResponses([]); // Clear previous responses

    try {
      const responses = await Promise.all(
        Array(3)
          .fill()
          .map(() =>
            axios.post('/api/content/train', { queryType, projectId: selectedProject })
          )
      );

      // Flatten the responses into one array
      const samples = responses.map((response) => response.data.samples[0] || '');
      setGeneratedResponses(samples);
    } catch (err) {
      console.error('Error generating samples:', err);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleTrain = async () => {
    if (!selectedResponse) {
      alert('Please select a response to train the model.');
      return;
    }

    try {
      await axios.post('/api/content/train/update', {
        queryType,
        selectedResponse,
        projectId: selectedProject,
      });
      alert('Model updated successfully.');
      setGeneratedResponses([]);
      setSelectedResponse(null);
    } catch (err) {
      console.error('Error training the model:', err);
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setProjectInfo(projects.find((project) => project.project_id === projectId) || {});
  };

  const formatResponse = (response) => {
    // Replace \n with <br /> for proper formatting
    return response.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Train Model
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {loadingProjects ? (
            <Skeleton variant="rectangular" height={56} />
          ) : (
            <Select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select Project
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </MenuItem>
              ))}
            </Select>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Select
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select Query Type
            </MenuItem>
            <MenuItem value="H1">H1 Title</MenuItem>
            <MenuItem value="H2">H2 Title</MenuItem>
            <MenuItem value="H1Intro">H1 Intro Paragraph</MenuItem>
            <MenuItem value="WhyChooseUs">Why Choose Us Paragraph</MenuItem>
            <MenuItem value="Tips">Tips About This Business Paragraph</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={loadingSamples || !selectedProject || !queryType}
          >
            {loadingSamples ? 'Generating...' : 'Generate Samples'}
          </Button>
        </Grid>
      </Grid>

      <Box mt={4}>
        {loadingSamples ? (
          <>
            <Typography variant="h6">Generating Responses...</Typography>
            <Grid container spacing={2}>
              {[...Array(3)].map((_, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Skeleton variant="rectangular" height={200} />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <>
            {projectInfo && selectedProject && (
              <Typography variant="h6">
                Training for Project: {projectInfo.project_name || 'Unknown Project'}
              </Typography>
            )}
            {generatedResponses.length > 0 && (
              <>
                <Typography variant="h6">Generated Responses:</Typography>
                <Grid container spacing={2}>
                  {generatedResponses.map((response, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Card
                        onClick={() => setSelectedResponse(response)}
                        sx={{
                          cursor: 'pointer',
                          border: selectedResponse === response ? '2px solid blue' : '1px solid #ccc',
                        }}
                      >
                        <CardContent>
                          <Typography>{formatResponse(response)}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleTrain}
                  sx={{ mt: 2 }}
                >
                  Train with Selected Response
                </Button>
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default TrainContent;
