// pages/content/train/index.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tabs,
  Tab,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Skeleton,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const TrainContent = () => {
  // Main Tabs: 0 - Training, 1 - Fine-Tuning
  const [mainTab, setMainTab] = useState(0);

  // Fine-Tuning Sub-Tabs: 0 - Datasets, 1 - Models
  const [fineTuneTab, setFineTuneTab] = useState(0);

  // State for Datasets
  const [datasetName, setDatasetName] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [isCreatingDataset, setIsCreatingDataset] = useState(false);
  const [openDatasetDialog, setOpenDatasetDialog] = useState(false);
  const [trainingData, setTrainingData] = useState([]); // All training_data entries
  const [selectedData, setSelectedData] = useState([]); // Indices of selected training_data
  const [selectAll, setSelectAll] = useState(false);

  // State for Models
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isCreatingModel, setIsCreatingModel] = useState(false);
  const [openModelDialog, setOpenModelDialog] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [fineTuneStatus, setFineTuneStatus] = useState(null);

  // State for Training (Existing Functionality)
  const [queryType, setQueryType] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [generatedResponses, setGeneratedResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSamples, setLoadingSamples] = useState(false);
  
  const [pollingInterval, setPollingInterval] = useState(null);
  const [selectedBaseModel, setSelectedBaseModel] = useState('gpt-4o-mini-2024-07-18');


  // Fetch Projects on Mount
  useEffect(() => {
    axios
      .get('/api/content/projects') // Ensure this endpoint exists and returns projects
      .then((response) => {
        setProjects(response.data.projects || []);
        setLoadingProjects(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingProjects(false);
        alert('Failed to fetch projects.');
      });
  }, []);

  // Fetch Datasets or Models when Fine-Tuning Tab Changes
  useEffect(() => {
    if (mainTab === 1) {
      if (fineTuneTab === 0) {
        fetchDatasets();
        fetchTrainingData();
      } else if (fineTuneTab === 1) {
        fetchModels();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab, fineTuneTab]);

  useEffect(() => {
    if (mainTab === 1 && fineTuneTab === 1) {
      fetchModelsWithPolling();
    }
  
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [mainTab, fineTuneTab]);
  

  // Fetch All training_data entries
  const fetchTrainingData = async () => {
    try {
      const response = await axios.get('/api/content/train/training-data'); // Ensure this endpoint exists
      setTrainingData(response.data.trainingData || []);
    } catch (error) {
      console.error('Error fetching training data:', error.response ? error.response.data : error.message);
      alert(`Failed to fetch training data: ${error.response?.data?.error || error.message}`);
    }
  };

  // Handle Main Tab Change
  const handleMainTabChange = (event, newValue) => {
    setMainTab(newValue);
  };

  // Handle Fine-Tuning Sub-Tab Change
  const handleFineTuneTabChange = (event, newValue) => {
    setFineTuneTab(newValue);
  };

  // Fetch Datasets
  const fetchDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const response = await axios.post('/api/content/train/fine-tune', {
        action: 'fetch-datasets',
      });
      setDatasets(response.data.datasets || []);
    } catch (error) {
      console.error('Error fetching datasets:', error.response ? error.response.data : error.message);
      alert(`Failed to fetch datasets: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoadingDatasets(false);
    }
  };
  

  // Fetch Models
  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await axios.post('/api/content/train/fine-tune', {
        action: 'fetch-models',
      });
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Error fetching models:', error.response ? error.response.data : error.message);
      alert(`Failed to fetch models: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const pollOpenAIStatus = async (models) => {
    const incompleteJobs = models.filter(
      (model) => !['succeeded', 'failed', 'cancelled'].includes(model.status)
    );
  
    if (incompleteJobs.length === 0) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return; // No incomplete jobs, stop polling
    }
  
    for (const job of incompleteJobs) {
      try {
        const response = await axios.post('/api/content/train/fine-tune', {
          action: 'status',
          fineTuneId: job.fine_tune_id, // Fine-tuning job ID
        });
  
        const updatedStatus = response.data.status;
  
        if (['succeeded', 'failed', 'cancelled'].includes(updatedStatus)) {
          // Update the job's status in the database
          await axios.post('/api/content/train/fine-tune', {
            action: 'update-status',
            fineTuneId: job.fine_tune_id,
            status: updatedStatus,
          });
  
          // Refresh the database models list
          fetchModels();
        }
      } catch (error) {
        console.error(
          `Error polling OpenAI status for job ${job.fine_tune_id}:`,
          error.response?.data || error.message
        );
      }
    }
  };
  const fetchModelsWithPolling = async () => {
    setIsLoadingModels(true);
    try {
      const response = await axios.post('/api/content/train/fine-tune', {
        action: 'fetch-models',
      });
  
      const modelsFromDB = response.data.models || [];
      setModels(modelsFromDB);
  
      if (!pollingInterval) {
        const interval = setInterval(() => pollOpenAIStatus(modelsFromDB), 5000); // Poll every 5 seconds
        setPollingInterval(interval);
      }
    } catch (error) {
      console.error('Error fetching models:', error.response ? error.response.data : error.message);
      alert(`Failed to fetch models: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  

  // Create Dataset
  const handleCreateDataset = async () => {
    if (!datasetName.trim()) {
      alert('Please enter a dataset name.');
      return;
    }

    if (selectedData.length < 10) { // Enforce minimum of 10 entries
      alert('Please select at least 10 entries for fine-tuning.');
      return;
    }

    setIsCreatingDataset(true);
    try {
      const selectedEntries = selectedData.map((index) => trainingData[index]);

      const response = await axios.post('/api/content/train/fine-tune', {
        action: 'create-dataset',
        dataset: selectedEntries,
        datasetName: datasetName.trim(),
      });

      alert('Dataset created and uploaded successfully.');
      setOpenDatasetDialog(false);
      setDatasetName('');
      setSelectedData([]);
      setSelectAll(false);
      fetchDatasets();
    } catch (error) {
      console.error('Error creating dataset:', error.response ? error.response.data : error.message);
      alert(`Failed to create dataset: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsCreatingDataset(false);
    }
  };

  // Handle Selecting/Deselecting training_data entries for Dataset creation
  const handleToggle = (index) => {
    const currentIndex = selectedData.indexOf(index);
    const newSelected = [...selectedData];

    if (currentIndex === -1) {
      newSelected.push(index);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setSelectedData(newSelected);
    setSelectAll(newSelected.length === trainingData.length);
  };

  // Handle Select All Checkbox
  const handleSelectAll = (event) => {
    const checked = event.target.checked;
    setSelectAll(checked);
    setSelectedData(checked ? trainingData.map((_, index) => index) : []);
  };

  // Create Model
const handleCreateModel = async () => {
    if (!selectedDatasetId || !selectedBaseModel) {
      alert('Please select a dataset and a base model for fine-tuning.');
      return;
    }
  
    if (!newModelName.trim()) {
      alert('Please enter a model name.');
      return;
    }
  
    setIsCreatingModel(true);
    try {
      const response = await axios.post('/api/content/train/fine-tune', {
        action: 'create-model',
        datasetId: selectedDatasetId,
        modelName: newModelName.trim(),
        baseModel: selectedBaseModel, // Pass the selected base model
      });
  
      alert('Fine-tuning initiated successfully.');
      setOpenModelDialog(false);
      setNewModelName('');
      fetchModels();
    } catch (error) {
      console.error('Error creating model:', error.response ? error.response.data : error.message);
      alert(`Failed to create model: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsCreatingModel(false);
    }
  };

  // Check Fine-Tune Status
  const handleCheckStatus = async (fineTuneId) => {
    try {
      const response = await axios.post('/api/content/train/fine-tune', {
        action: 'status',
        fineTuneId,
      });
      setFineTuneStatus(response.data.status);
      alert(`Fine-tune Status: ${response.data.status}`);
      // Optionally, refresh the models list to update status
      fetchModels();
    } catch (error) {
      console.error('Error checking fine-tune status:', error.response ? error.response.data : error.message);
      alert(`Failed to check fine-tune status: ${error.response?.data?.error || error.message}`);
    }
  };

  // Handle Project Change (Training Tab)
  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setProjectInfo(projects.find((project) => project.project_id === projectId) || {});
  };

  // Generate Samples (Training Tab)
  const handleGenerate = async () => {
    if (!queryType || !selectedProject) {
      alert('Please select a query type and project.');
      return;
    }

    setLoadingSamples(true);
    setGeneratedResponses([]);

    try {
      const response = await axios.post('/api/content/train', { queryType, projectId: selectedProject }); // Ensure this endpoint exists
      const samples = response.data.samples || [];
      setGeneratedResponses(samples);
    } catch (err) {
      console.error('Error generating samples:', err);
      alert('Failed to generate samples.');
    } finally {
      setLoadingSamples(false);
    }
  };

  // Train with Selected Response (Training Tab)
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
      }); // Ensure this endpoint exists
      alert('Model updated successfully.');
      setGeneratedResponses([]);
      setSelectedResponse(null);
    } catch (err) {
      console.error('Error training the model:', err);
      alert('Failed to train the model.');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        AI Training and Fine-Tuning
      </Typography>

      <Tabs value={mainTab} onChange={handleMainTabChange}>
        <Tab label="Training" />
        <Tab label="Fine-Tuning" />
      </Tabs>

      {/* Training Tab */}
      {mainTab === 0 && (
        <Box mt={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              {loadingProjects ? (
                <Skeleton variant="rectangular" height={56} />
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="project-select-label">Select Project</InputLabel>
                  <Select
                    labelId="project-select-label"
                    value={selectedProject}
                    label="Select Project"
                    onChange={(e) => handleProjectChange(e.target.value)}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="query-type-select-label">Select Query Type</InputLabel>
                <Select
                  labelId="query-type-select-label"
                  value={queryType}
                  label="Select Query Type"
                  onChange={(e) => setQueryType(e.target.value)}
                >
                  <MenuItem value="H1">H1 Title</MenuItem>
                  <MenuItem value="H2">H2 Title</MenuItem>
                  <MenuItem value="H1Intro">H1 Intro Paragraph</MenuItem>
                  <MenuItem value="WhyChooseUs">Why Choose Us Paragraph</MenuItem>
                  <MenuItem value="Tips">Tips About This Business Paragraph</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerate}
                disabled={loadingSamples || !selectedProject || !queryType}
                fullWidth
              >
                {loadingSamples ? 'Generating...' : 'Generate Samples'}
              </Button>
            </Grid>
          </Grid>

          <Box mt={4}>
            {loadingSamples ? (
              <Grid container spacing={2}>
                {[...Array(3)].map((_, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Skeleton variant="rectangular" height={200} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <>
                {generatedResponses.length > 0 && (
                  <Grid container spacing={2}>
                    {generatedResponses.map((response, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Card
                          onClick={() => setSelectedResponse(response)}
                          sx={{
                            cursor: 'pointer',
                            border:
                              selectedResponse === response
                                ? '2px solid blue'
                                : '1px solid #ccc',
                          }}
                        >
                          <CardContent>
                            <Typography>{response}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleTrain}
                  sx={{ mt: 2 }}
                  disabled={!selectedResponse}
                >
                  Train with Selected Response
                </Button>
              </>
            )}
          </Box>
        </Box>
      )}

      {/* Fine-Tuning Tab */}
      {mainTab === 1 && (
        <Box mt={3}>
          {/* Fine-Tuning Sub-Tabs */}
          <Tabs value={fineTuneTab} onChange={handleFineTuneTabChange}>
            <Tab label="Datasets" />
            <Tab label="Models" />
          </Tabs>

          {/* Datasets Sub-Tab */}
          {fineTuneTab === 0 && (
            <Box mt={3}>
              {/* Create Dataset Button */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenDatasetDialog(true)}
              >
                Create Dataset
              </Button>

              {/* List of Datasets */}
              <Box mt={2}>
                {isLoadingDatasets ? (
                  <Skeleton variant="rectangular" height={100} />
                ) : datasets.length > 0 ? (
                  <List>
                    {datasets.map((dataset) => (
                      <ListItem key={dataset.id} divider>
                        <ListItemText
                          primary={dataset.dataset_name}
                          secondary={`Uploaded on: ${new Date(dataset.created_at).toLocaleString()} | Size: ${dataset.file_size_mb} MB`}
                        />
                        {/* Optional: Add buttons for editing or viewing associated training_data */}
                        {/* <Button variant="outlined" size="small" onClick={() => handleViewDataset(dataset.id)}>
                          View
                        </Button> */}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>No datasets available.</Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Models Sub-Tab */}
          {fineTuneTab === 1 && (
            <Box mt={3}>
              {/* Create Model Button */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenModelDialog(true)}
              >
                Create Model
              </Button>

              {/* List of Models */}
              <Box mt={2}>
                {isLoadingModels ? (
                  <Skeleton variant="rectangular" height={100} />
                ) : models.length > 0 ? (
                    <List>
                    {models.map((model) => (
                      <ListItem key={model.id} divider>
                        <ListItemText
                          primary={model.model_name}
                          secondary={`Status: ${model.status} | Dataset: ${model.dataset_name} | Output Model: ${model.output_model || 'N/A'} | Created on: ${new Date(
                            model.created_at
                          ).toLocaleString()}`}
                        />
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSelectedBaseModel(model.output_model || model.model_name); // Pre-select this model as the base
                            setOpenModelDialog(true); // Open the dialog
                          }}
                          disabled={!['succeeded'].includes(model.status)} // Enable only for successfully fine-tuned models
                        >
                          Fine-Tune Further
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleCheckStatus(model.fine_tune_id)}
                        >
                          Check Status
                        </Button>
                      </ListItem>
                    ))}
                  </List>                  
                ) : (
                  <Typography>No fine-tuned models available.</Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Create Dataset Dialog */}
      <Dialog
        open={openDatasetDialog}
        onClose={() => setOpenDatasetDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create New Dataset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dataset Name"
            type="text"
            fullWidth
            variant="outlined"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
          />
          <Typography variant="subtitle1" mt={2}>
            Select Training Data Entries:
          </Typography>
          <Box
            mt={1}
            maxHeight={300}
            overflow="auto"
            border={1}
            borderColor="grey.300"
            borderRadius={2}
            p={1}
          >
            {trainingData.length > 0 ? (
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Checkbox
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Select All" />
                </ListItem>
                <Divider />
                {trainingData.map((item, index) => (
                  <ListItem
                    key={item.id}
                    dense
                    button
                    onClick={() => handleToggle(index)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedData.indexOf(index) !== -1}
                        tabIndex={-1}
                        disableRipple
                        onChange={() => handleToggle(index)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Input: ${item.input_text}`}
                      secondary={`Output: ${item.output_text}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No training data available.</Typography>
            )}
          </Box>
          <Typography variant="body2" color="textSecondary" mt={2}>
            Note: Select at least 10 entries to create a dataset.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDatasetDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDataset}
            disabled={isCreatingDataset || selectedData.length < 10}
          >
            {isCreatingDataset ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Model Dialog */}
      <Dialog
        open={openModelDialog}
        onClose={() => setOpenModelDialog(false)}
        fullWidth
        maxWidth="sm"
        >
        <DialogTitle>Create New Fine-Tuned Model</DialogTitle>
        <DialogContent>
            <FormControl fullWidth margin="dense">
            <InputLabel id="select-base-model-label">Select Base Model</InputLabel>
            <Select
                labelId="select-base-model-label"
                value={selectedBaseModel}
                label="Select Base Model"
                onChange={(e) => setSelectedBaseModel(e.target.value)}
            >
                <MenuItem value="gpt-4o-mini-2024-07-18">GPT-4o-Mini-2024</MenuItem>
                <MenuItem value="gpt-3.5-turbo">GPT-3.5-Turbo</MenuItem>
                {models
                .filter((model) => model.status === 'succeeded' && model.output_model)
                .map((model) => (
                    <MenuItem key={model.id} value={model.output_model}>
                    {model.model_name} (Fine-Tuned)
                    </MenuItem>
                ))}
            </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
            <InputLabel id="select-dataset-label">Select Dataset</InputLabel>
            <Select
                labelId="select-dataset-label"
                value={selectedDatasetId}
                label="Select Dataset"
                onChange={(e) => setSelectedDatasetId(e.target.value)}
            >
                {datasets.map((dataset) => (
                <MenuItem key={dataset.id} value={dataset.dataset_id}>
                    {dataset.dataset_name}
                </MenuItem>
                ))}
            </Select>
            </FormControl>
            <TextField
            margin="dense"
            label="Model Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            />
            <Typography variant="body2" color="textSecondary" mt={2}>
            Ensure the model name is unique and descriptive.
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenModelDialog(false)}>Cancel</Button>
            <Button
            onClick={handleCreateModel}
            disabled={isCreatingModel || !selectedDatasetId || !newModelName.trim()}
            >
            {isCreatingModel ? 'Creating...' : 'Create'}
            </Button>
        </DialogActions>
        </Dialog>

    </Box>
  );
};

export default TrainContent;
