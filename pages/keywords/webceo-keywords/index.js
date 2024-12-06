import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Typography,
  Box,
  CircularProgress,
  Modal,
  TextField,
  Checkbox,
} from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';

import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  CloudDownload as CloudDownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const WebCEOKeywordsPage = () => {
  // State variables
  const [projects, setProjects] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [fetchingProjects, setFetchingProjects] = useState({});
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchSize, setBatchSize] = useState(5); // Default batch size
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);


  // Fetch projects and existing Excel files on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch projects with suspended=0 and suspended=1
        const [activeProjectsResponse, suspendedProjectsResponse] = await Promise.all([
          axios.get('/api/webceo-keywords/fetchProjects?suspended=0').catch((error) => {
            console.error('Error fetching active projects:', error);
            setSnackbar((prev) => ({
              ...prev,
              open: true,
              message: 'Failed to fetch active projects.',
              severity: 'error',
            }));
            return { data: { projects: [] } }; // Return empty array
          }),
         /* axios.get('/api/webceo-keywords/fetchProjects?suspended=1').catch((error) => {
            console.error('Error fetching suspended projects:', error);
            setSnackbar((prev) => ({
              ...prev,
              open: true,
              message: 'Failed to fetch suspended projects.',
              severity: 'error',
            }));
            return { data: { projects: [] } }; // Return empty array
          }),*/
        ]);

        const combinedProjects = [
          ...(activeProjectsResponse.data.projects || []),
         // ...(suspendedProjectsResponse.data.projects || []),
        ];

        setProjects(combinedProjects);

        // Log the projects to verify structure
        console.log('Fetched Projects:', combinedProjects);

        // Fetch existing Excel files
        const filesResponse = await axios.get('/api/webceo-keywords/listExcelFiles');
        setExistingFiles(filesResponse.data.files);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({ open: true, message: 'Failed to fetch data.', severity: 'error' });
      }
      setLoadingProjects(false);
      setLoadingFiles(false);
    };

    fetchAllData();
  }, []);

  /**
   * Handler to process fetch response
   */
  const handleFetch = useCallback(
    async (data) => {
      console.log('Fetch Project Response:', data);
      if (data.files) {
        setExistingFiles((prevFiles) => [
          ...new Set([...data.files.map((file) => file.split('/').pop()), ...prevFiles]),
        ]);
      }

      try {
        const response = await axios.get('/api/webceo-keywords/listExcelFiles');
        setExistingFiles(response.data.files);
      } catch (error) {
        console.error('Error updating file list:', error);
      }

      setSnackbar({ open: true, message: data.message, severity: 'success' });
    },
    [setExistingFiles, setSnackbar]
  );

  /**
   * Handler to manage individual project fetch
   */
  const handleFetchProject = useCallback(
    async (row) => {
      setFetchingProjects((prev) => ({ ...prev, [row.id]: true }));
      try {
        const response = await axios.post('/api/webceo-keywords/fetchProject', {
          projectId: row.id, // Use row.id
          projectName: row.name,
        });
        await handleFetch(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
        setSnackbar({ open: true, message: `Failed to fetch project ${row.name}.`, severity: 'error' });
      } finally {
        setFetchingProjects((prev) => ({ ...prev, [row.id]: false }));
      }
    },
    [handleFetch, setFetchingProjects, setSnackbar]
  );

  /**
   * Handler to manage fetching all projects
   */
  const handleFetchAllProjects = useCallback(async () => {
    console.log('Started fetching all projects');
    const projectsToFetch = projects; // Fetch all projects

    // Initialize fetching status for all projects
    const newFetchingProjects = {};
    projectsToFetch.forEach((project) => {
      newFetchingProjects[project.project] = true; // Use project.project
    });
    setFetchingProjects(newFetchingProjects);

    try {
      for (let i = 0; i < projectsToFetch.length; i += batchSize) {
        const batch = projectsToFetch.slice(i, i + batchSize);

        // Fetch projects in parallel
        await Promise.all(
          batch.map(async (project) => {
            try {
              const response = await axios.post('/api/webceo-keywords/fetchProject', {
                projectId: project.project, // Use project.project
                projectName: project.domain, // Use project.domain
              });
              await handleFetch(response.data); // process the response
            } catch (error) {
              console.error('Error fetching project:', error);
              setSnackbar({
                open: true,
                message: `Failed to fetch project ${project.domain}.`,
                severity: 'error',
              });
            } finally {
              setFetchingProjects((prev) => ({ ...prev, [project.project]: false }));
            }
          })
        );
      }
      setSnackbar({ open: true, message: 'Fetch All Projects operation completed.', severity: 'success' });
    } catch (error) {
      console.error('Error fetching all projects:', error);
      setSnackbar({ open: true, message: 'Failed to fetch all projects.', severity: 'error' });
    }
  }, [projects, batchSize, handleFetch, setFetchingProjects, setSnackbar]);
  /**
   * Handler to delete an Excel file
   */
  const handleDelete = useCallback(async (fileName) => {
    try {
      await axios.delete('/api/webceo-keywords/deleteExcel', { data: { fileName } });
      setExistingFiles((prevFiles) => prevFiles.filter((file) => file !== fileName));
      setSnackbar({ open: true, message: `File "${fileName}" deleted successfully.`, severity: 'success' });
    } catch (error) {
      console.error('Error deleting Excel file:', error);
      setSnackbar({ open: true, message: `Failed to delete file "${fileName}".`, severity: 'error' });
    }
  }, []);
// Add the function to handle deleting all files
const handleDeleteAllFiles = async () => {
  try {
    await axios.delete('/api/webceo-keywords/deleteAllExcel');
    setExistingFiles([]);
    setSnackbar({ open: true, message: 'All files deleted successfully.', severity: 'success' });
  } catch (error) {
    console.error('Error deleting all files:', error);
    setSnackbar({ open: true, message: 'Failed to delete all files.', severity: 'error' });
  } finally {
    setDeleteAllDialogOpen(false);
  }
};



  const handlePreview = useCallback(async (fileName) => {
    try {
      const response = await axios.get(`/excel/${fileName}`, { responseType: 'text' });
      setPreviewContent(response.data);
      setPreviewFileName(fileName); // Set the file name being previewed
      setPreviewModalOpen(true);
    } catch (error) {
      console.error('Error previewing file:', error);
      setSnackbar({ open: true, message: 'Failed to preview the file.', severity: 'error' });
    }
  }, []);

  /**
   * Prepare data for MUI's Table
   */
  const tableData = useMemo(() => {
    return projects.map((project) => {
      const normalizedProjectName = project.domain.replace(/^www\./, '').toLowerCase();
      const matchingFiles = existingFiles.filter((file) => file.startsWith(normalizedProjectName));

      return {
        id: project.project, // Unique identifier
        name: normalizedProjectName,
        suspended: project.suspended === 1 ? 'Yes' : 'No',
        excelFiles: matchingFiles.map((file) => ({
          fileName: file,
        })),
      };
    });
  }, [projects, existingFiles]);

  // Filtered data based on search query
  const filteredData = useMemo(() => {
    return tableData.filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tableData, searchQuery]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredData.map((n) => n.id);
      setSelectedProjects(newSelected);
      return;
    }
    setSelectedProjects([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selectedProjects.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedProjects, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedProjects.slice(1));
    } else if (selectedIndex === selectedProjects.length - 1) {
      newSelected = newSelected.concat(selectedProjects.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedProjects.slice(0, selectedIndex),
        selectedProjects.slice(selectedIndex + 1)
      );
    }

    setSelectedProjects(newSelected);
  };

  const handleDownloadSelected = async () => {
    try {
      const response = await axios.post(
        '/api/webceo-keywords/downloadZip',
        {
          fileNames: selectedProjects
            .map((projectId) => {
              const project = tableData.find((p) => p.id === projectId);
              return project.excelFiles.map((file) => file.fileName);
            })
            .flat(),
        },
        {
          responseType: 'blob',
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'selected_projects.zip');
      // Append to the document and trigger click
      document.body.appendChild(link);
      link.click();
      // Clean up
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading selected files:', error);
      setSnackbar({ open: true, message: 'Failed to download selected files.', severity: 'error' });
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await axios.get('/api/webceo-keywords/downloadZipAll', {
        responseType: 'blob',
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all_projects.zip');
      // Append to the document and trigger click
      document.body.appendChild(link);
      link.click();
      // Clean up
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading all files:', error);
      setSnackbar({ open: true, message: 'Failed to download all files.', severity: 'error' });
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const isSelected = (id) => selectedProjects.indexOf(id) !== -1;

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" gutterBottom>
        WebCEO Keywords Fetcher
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, marginBottom: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchAllProjects}
          startIcon={<CloudDownloadIcon />}
        >
          Fetch Ranking Data for All Projects
        </Button>
        <Button variant="outlined" onClick={() => window.location.reload()} startIcon={<RefreshIcon />}>
          Refresh Data
        </Button>
        <TextField
          label="Search Projects"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleDownloadSelected}
          disabled={selectedProjects.length === 0}
          startIcon={<DownloadIcon />}
        >
          Download Selected as ZIP
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleDownloadAll}
          startIcon={<DownloadIcon />}
        >
          Download All as ZIP
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setDeleteAllDialogOpen(true)}
          startIcon={<DeleteIcon />}
        >
          Delete All Files
        </Button>
      </Box>

      {loadingProjects || loadingFiles ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="projects table" size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedProjects.length > 0 && selectedProjects.length < filteredData.length
                    }
                    checked={filteredData.length > 0 && selectedProjects.length === filteredData.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all projects' }}
                  />
                </TableCell>
                <TableCell>
                  <strong>Project Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Suspended</strong>
                </TableCell>
                <TableCell>
                  <strong>Excel Files</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => {
                const isItemSelected = isSelected(row.id);
                return (
                  <TableRow
                    key={row.id}
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                    style={{
                      backgroundColor: fetchingProjects[row.id] ? '#f0f0f0' : 'inherit',
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        onChange={(event) => handleClick(event, row.id)}
                        inputProps={{ 'aria-labelledby': `enhanced-table-checkbox-${row.id}` }}
                      />
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={row.suspended === 'Yes' ? 'error' : 'textPrimary'}
                      >
                        {row.suspended}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.excelFiles.length === 0 ? (
                        <Typography variant="body2">No Excel Files</Typography>
                      ) : (
                        row.excelFiles.map((file, index) => (
                          <Box
                            key={index}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}
                          >
                            {/* Download Button */}
                            <Tooltip title="Download CSV File">
                              <IconButton
                                component="a"
                                href={`/excel/${file.fileName}`}
                                download
                                color="primary"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>

                            {/* Preview Button */}
                            <Tooltip title="Preview CSV File">
                              <IconButton onClick={() => handlePreview(file.fileName)} color="secondary">
                                <PreviewIcon />
                              </IconButton>
                            </Tooltip>

                            
                            {/* Delete Button */}
                            <Tooltip title="Delete CSV File">
                              <IconButton color="error" onClick={() => handleDelete(file.fileName)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>

                            {/* File Name */}
                            <Typography variant="body2">{file.fileName}</Typography>

                          </Box>
                        ))
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleFetchProject(row)}
                        disabled={fetchingProjects[row.id]}
                      >
                        {fetchingProjects[row.id] ? (
                          <CircularProgress size={24} />
                        ) : (
                           <CloudDownloadIcon />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Preview Modal */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            padding: 2,
            borderRadius: 2,
            maxHeight: '90vh',
            overflow: 'auto',
            width: '80%',
          }}
        >
          <Typography variant="h6" gutterBottom>
            CSV Preview: <span style={{ fontWeight: 'normal' }}>{previewFileName}</span>
          </Typography>
          <pre>{previewContent}</pre>
          <Button onClick={() => setPreviewModalOpen(false)}>Close</Button>
        </Box>
      </Modal>
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        aria-labelledby="delete-all-dialog-title"
        aria-describedby="delete-all-dialog-description"
      >
        <DialogTitle id="delete-all-dialog-title">Confirm Delete All Files</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-all-dialog-description">
            Are you sure you want to delete all files? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteAllFiles} color="error">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WebCEOKeywordsPage;
