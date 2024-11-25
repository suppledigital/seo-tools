// pages/webceo-keywords/index.js
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
} from '@mui/material';
import { Download as DownloadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import FetchSampleButton from '../../components/webceo/FetchSampleButton';
import FetchButton from '../../components/webceo/FetchButton';
import FetchAllButton from '../../components/webceo/FetchAllButton';


const WebCEOKeywordsPage = () => {
    // State variables
    const [projects, setProjects] = useState([]);
    const [fetchAllResults, setFetchAllResults] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
    // Fetch projects and existing Excel files on component mount
    useEffect(() => {
      const fetchAllData = async () => {
        try {
          // Fetch projects
          const projectsResponse = await axios.get('/api/webceo-keywords/fetchProjects');
          setProjects(projectsResponse.data.projects);
  
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
     * Handler to manage individual project fetch
     */
    const handleFetch = useCallback((data) => {
      console.log('Fetch Project Response:', data);
      if (data.file) {
        setExistingFiles((prevFiles) => [...prevFiles, data.file.split('/').pop()]);
      }
      setSnackbar({ open: true, message: data.message, severity: 'success' });
    }, []);
  
    /**
     * Handler to manage fetching all projects
     */
    const handleFetchAll = useCallback((results) => {
      setFetchAllResults(results);
      // Update existingFiles with successfully created files
      const newFiles = results
        .filter((result) => result.status === 'Success' && result.file)
        .map((result) => result.file.split('/').pop());
      setExistingFiles((prevFiles) => [...newFiles, ...prevFiles]);
      setSnackbar({ open: true, message: 'Fetch All Projects operation completed.', severity: 'success' });
    }, []);
  
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
  
    /**
     * Prepare data for MUI's Table
     */
    const tableData = useMemo(() => {
      return projects.map((project) => {
        const matchingFiles = existingFiles.filter((file) =>
          file.startsWith(project.domain.replace(/[^a-z0-9]/gi, '_').toLowerCase())
        );
  
        return {
          id: project.project, // Unique identifier
          name: project.domain,
          suspended: project.suspended ? 'Yes' : 'No',
          excelFiles: matchingFiles.map((file) => ({
            fileName: file,
            createdAt: (() => {
              const timestampPart = file.split('_').pop()?.split('.xlsx')[0];
              const timestamp = timestampPart ? parseInt(timestampPart, 10) : NaN;
              return isNaN(timestamp) ? 'Unknown' : new Date(timestamp).toLocaleString();
            })(),
          })),
        };
      });
    }, [projects, existingFiles]);
  
    const handleSnackbarClose = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }
      setSnackbar({ ...snackbar, open: false });
    };
  
    return (
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom>
          WebCEO Keywords Fetcher
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 4 }}>
          <FetchAllButton onFetchAll={handleFetchAll} />
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Refresh Data
          </Button>
        </Box>
  
        {(loadingProjects || loadingFiles) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="projects table">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Project Name</strong></TableCell>
                  <TableCell><strong>Suspended</strong></TableCell>
                  <TableCell><strong>Excel Files</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color={row.suspended === 'Yes' ? 'error' : 'success'}>
                        {row.suspended}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.excelFiles.length === 0 ? (
                        <Typography variant="body2">No Excel Files</Typography>
                      ) : (
                        row.excelFiles.map((file, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                            <Tooltip title="Download Excel File">
                              <IconButton
                                component="a"
                                href={`/excel/${file.fileName}`}
                                download
                                color="primary"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Typography variant="body2">{file.fileName}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Created At: {file.createdAt}
                            </Typography>
                            <Tooltip title="Delete Excel File">
                              <IconButton
                                color="error"
                                onClick={() => handleDelete(file.fileName)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ))
                      )}
                    </TableCell>
                    <TableCell>
                      <FetchButton
                        projectId={row.id}
                        projectName={row.name}
                        onFetch={handleFetch}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
  
        {fetchAllResults.length > 0 && (
          <Box sx={{ marginTop: 6 }}>
            <Typography variant="h5" gutterBottom>
              Fetch All Results
            </Typography>
            <TableContainer component={Paper}>
              <Table aria-label="fetch all results table">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Project Name</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Excel File</strong></TableCell>
                    <TableCell><strong>Error</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetchAllResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.project}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={result.status === 'Success' ? 'success.main' : 'error'}>
                          {result.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {result.file ? (
                          <Button
                            variant="text"
                            color="primary"
                            href={result.file}
                            download
                            startIcon={<DownloadIcon />}
                          >
                            Download
                          </Button>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {result.error || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
  
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