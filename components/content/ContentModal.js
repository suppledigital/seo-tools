// components/content/ContentModal.js

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Grid,
} from '@mui/material';
import { styled } from '@mui/system';
import { diffWordsWithSpace } from 'diff';
import DOMPurify from 'dompurify';

const HighlightedText = styled('span')(({ theme }) => ({
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.contrastText,
  padding: '2px 4px',
  borderRadius: '4px',
}));

export default function ContentModal({ isOpen, onClose, content, humanizedContent }) {
  const [showDifferences, setShowDifferences] = useState(false);

  const handleToggle = () => {
    setShowDifferences((prev) => !prev);
  };

  const sanitizeContent = (text) => {
    if (!text) return 'No content available.';
    return DOMPurify.sanitize(text);
  };

  const formatContent = (text) => {
    if (!text) return 'No content available.';
    return (
      <Typography
        variant="body1"
        component="div"
        style={{ whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  const computeDifferences = () => {
    if (!content || !humanizedContent) return 'No differences available.';

    // Use diffWordsWithSpace to include spaces in the diff
    const diff = diffWordsWithSpace(content, humanizedContent);

    return (
      <Typography variant="body1">
        {diff.map((part, index) => {
          if (part.added) {
            return <HighlightedText key={index}>{part.value}</HighlightedText>;
          } else if (part.removed) {
            // Optionally, show removed text differently or skip
            return null; // Skipping removed text for simplicity
          } else {
            return <span key={index}>{part.value}</span>;
          }
        })}
      </Typography>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Generated vs Humanized Content</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">View Options</Typography>
          <FormControlLabel
            control={<Switch checked={showDifferences} onChange={handleToggle} />}
            label="Show Differences"
          />
        </Box>
        {!showDifferences ? (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Generated Content</strong>
              </Typography>
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '16px',
                  height: '400px',
                  overflowY: 'auto',
                  backgroundColor: '#f9f9f9',
                }}
              >
                {formatContent(sanitizeContent(content))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Humanized Content</strong>
              </Typography>
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '16px',
                  height: '400px',
                  overflowY: 'auto',
                  backgroundColor: '#f1f1f1',
                }}
              >
                {formatContent(sanitizeContent(humanizedContent))}
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Differences</strong>
            </Typography>
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '16px',
                height: '400px',
                overflowY: 'auto',
                backgroundColor: '#f0f0f0',
              }}
            >
              {computeDifferences()}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
