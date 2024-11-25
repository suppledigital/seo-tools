// components/FetchAllButton.js
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

const FetchAllButton = ({ onFetchAll }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/webceo-keywords/fetchAll');
      onFetchAll(response.data.results);
      setSnackbar({ open: true, message: 'All projects fetched successfully.', severity: 'success' });
    } catch (error) {
      console.error('Error fetching all projects:', error);
      setSnackbar({ open: true, message: 'Failed to fetch all projects.', severity: 'error' });
    }
    setLoading(false);
    setOpen(false);
  }, [onFetchAll]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button variant="contained" color="secondary" onClick={handleClickOpen}>
        Fetch All Projects
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Fetch All</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to fetch data for all projects? This action will generate Excel files for all projects.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleFetchAll} color="secondary" disabled={loading}>
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

export default FetchAllButton;
