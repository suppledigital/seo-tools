// pages/keywords/importer/index.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Button,
  Paper,
} from '@mui/material';

const ImporterPage = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [processedProjects, setProcessedProjects] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [processedKeywords, setProcessedKeywords] = useState(0);
  const [totalKeywords, setTotalKeywords] = useState(0);
  const [statusId, setStatusId] = useState(null);

  const [isPaused, setIsPaused] = useState(false); // track paused state

  useEffect(() => {
    let interval;
    if (isImporting) {
      interval = setInterval(fetchStatus, 5000); // poll every 5s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isImporting]);

  const fetchStatus = async () => {
    if (!statusId) return;
    const res = await axios.get('/api/keywords/seranking/status');
    if (res.data) {
      setStatusMessage(res.data.status_message || '');
      setProcessedProjects(res.data.processed_projects || 0);
      setTotalProjects(res.data.total_projects || 0);
      setProcessedKeywords(res.data.processed_keywords || 0);
      setTotalKeywords(res.data.total_keywords || 0);

      // Determine if paused from response (if you add a field in status)
      setIsPaused(res.data.is_paused === 1);

      if (res.data.status_message === 'Import completed successfully.' || res.data.status_message === 'Import failed.') {
        setIsImporting(false);
      }
    }
  };

  const startImport = async () => {
    setIsImporting(true);
    setStatusMessage('Import in progress...');
    setProcessedProjects(0);
    setTotalProjects(0);
    setProcessedKeywords(0);
    setTotalKeywords(0);
    setIsPaused(false);

    try {
      const res = await axios.post('/api/keywords/seranking/import');
      setStatusMessage(res.data.message || 'Import completed successfully.');
      // If your import initialization returns statusId, store it:
      // Adjust import.js to return statusId in response if needed
      // setStatusId(res.data.statusId);

      if (res.data.message === 'Import completed successfully.') {
        setIsImporting(false);
      } else {
        // If you don't have statusId from import route directly, fetch from status route:
        const statusRes = await axios.get('/api/keywords/seranking/status');
        if (statusRes.data.id) setStatusId(statusRes.data.id);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setStatusMessage('Failed to import data. Check console for details.');
      setIsImporting(false);
    }
  };

  const pauseImport = async () => {
    if (!statusId) return;
    try {
      const res = await axios.post('/api/keywords/seranking/pause', { statusId, pause: true });
      setIsPaused(true);
      setStatusMessage(res.data.message);
    } catch (err) {
      console.error('Error pausing import:', err);
    }
  };

  const resumeImport = async () => {
    if (!statusId) return;
    try {
      const res = await axios.post('/api/keywords/seranking/pause', { statusId, pause: false });
      setIsPaused(false);
      setStatusMessage(res.data.message);
    } catch (err) {
      console.error('Error resuming import:', err);
    }
  };

  const stopImport = async () => {
    if (!statusId) return;
    try {
      const res = await axios.post('/api/keywords/seranking/stop', { statusId });
      setStatusMessage(res.data.message);
      // Stop polling and mark isImporting false
      setIsImporting(false);
    } catch (err) {
      console.error('Error stopping import:', err);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Keyword Importer
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          Import keywords and projects from SERanking.
        </Typography>
        {!isImporting && (
          <Button
            variant="contained"
            color="primary"
            onClick={startImport}
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Start Import'}
          </Button>
        )}
        {isImporting && (
          <Box mt={2}>
            {isPaused ? (
              <Button variant="contained" color="primary" onClick={resumeImport}>Resume</Button>
            ) : (
              <Button variant="contained" color="secondary" onClick={pauseImport}>Pause</Button>
            )}
            <Button variant="outlined" color="error" onClick={stopImport} sx={{ ml: 2 }}>Stop</Button>
          </Box>
        )}
      </Paper>

      {statusMessage && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography>{statusMessage}</Typography>
          {isImporting && (
            <Typography>Projects: {processedProjects}/{totalProjects} | Keywords: {processedKeywords}/{totalKeywords}</Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ImporterPage;
