import { useState, useRef } from 'react';
import { Fab, Popover, Button, Divider, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import DescriptionIcon from '@mui/icons-material/Description';

function AdvancedFabActions() {
  const [anchorEl, setAnchorEl] = useState(null);
  const buttonRef = useRef(null);

  const handleOpen = () => setAnchorEl(buttonRef.current);
  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
      <Fab color="primary" ref={buttonRef} onClick={open ? handleClose : handleOpen}>
        <AddIcon />
      </Fab>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        PaperProps={{ sx: { p: 2, width: 220 } }}
      >
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Setup
        </Typography>
        <Button
          fullWidth
          startIcon={<SettingsIcon />}
          onClick={() => { console.log('Configure Project'); handleClose(); }}
        >
          Configure
        </Button>
        <Button
          fullWidth
          startIcon={<GroupIcon />}
          onClick={() => { console.log('Auto Classify Page Type'); handleClose(); }}
        >
          Classify Page
        </Button>

        <Divider sx={{ my: 1 }} />

        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Generate
        </Typography>
        <Button
          fullWidth
          startIcon={<PlayArrowIcon />}
          onClick={() => { console.log('Generate All'); handleClose(); }}
        >
          Generate All
        </Button>
        <Button
          fullWidth
          startIcon={<ReplayIcon />}
          onClick={() => { console.log('Force Generate All'); handleClose(); }}
        >
          Force Generate
        </Button>

        <Divider sx={{ my: 1 }} />

        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Export
        </Typography>
        <Button
          fullWidth
          startIcon={<DescriptionIcon />}
          onClick={() => { console.log('Export to Google Docs'); handleClose(); }}
        >
          Export
        </Button>
      </Popover>
    </Box>
  );
}

export default AdvancedFabActions;
