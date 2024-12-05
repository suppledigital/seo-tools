// components/content/InfoModal.js

import styles from './InfoModal.module.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';


export default function InfoModal({ isVisible, onClose, title, value, onChange, onSave }) {
  return (
    <Dialog open={isVisible} onClose={onClose} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="infoValue"
          label="Value"
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
