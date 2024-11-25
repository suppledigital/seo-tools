// components/FetchButton.js
import React, { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const FetchButton = ({ projectId, projectName, onFetch }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/webceo-keywords/fetchProject', {
        projectId,
        projectName,
      });
      onFetch(response.data);
      setSnackbar({ open: true, message: `Project "${projectName}" fetched successfully.`, severity: 'success' });
    } catch (error) {
      console.error(`Error fetching project "${projectName}":`, error);
      setSnackbar({ open: true, message: `Failed to fetch project "${projectName}".`, severity: 'error' });
    }
    setLoading(false);
    setOpen(false);
  }, [projectId, projectName, onFetch]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        Fetch
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Fetch</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to fetch data for project "{projectName}"? This action will generate an Excel file with the latest data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleFetch} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FetchButton;
