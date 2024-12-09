// components/content/ContentModal.js

import React, { useState, useRef, useEffect } from 'react';
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
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/system';
import { diffWords } from 'diff';
import DOMPurify from 'dompurify';

// Styled components for highlighting
const AddedSpan = styled('span')(({ theme }) => ({
  backgroundColor: '#d4edda', // Light green
  color: '#155724', // Dark green text
  padding: '2px 4px',
  borderRadius: '4px',
}));

const RemovedSpan = styled('span')(({ theme }) => ({
  backgroundColor: '#f8d7da', // Light red
  color: '#721c24', // Dark red text
  padding: '2px 4px',
  borderRadius: '4px',
  textDecoration: 'line-through',
}));

export default function ContentModal({ isOpen, onClose, content, humanizedContent }) {
  const [showDifferences, setShowDifferences] = useState(false);
  const generatedRef = useRef(null);
  const humanizedRef = useRef(null);
  const [isSyncingScroll, setIsSyncingScroll] = useState(false);

  const handleToggle = () => {
    setShowDifferences((prev) => !prev);
  };

  const sanitizeContent = (text) => {
    if (!text) return 'No content available.';
    return DOMPurify.sanitize(text);
  };

  const computeDifferences = () => {
    if (!content || !humanizedContent) return 'No differences available.';

    // Use diffWords to compare content word by word
    const diff = diffWords(content, humanizedContent, { ignoreCase: false });

    return (
      <Typography variant="body1" component="div">
        {diff.map((part, index) => {
          if (part.added) {
            return (
              <Tooltip key={index} title="Added">
                <AddedSpan>{part.value}</AddedSpan>
              </Tooltip>
            );
          } else if (part.removed) {
            return (
              <Tooltip key={index} title="Removed">
                <RemovedSpan>{part.value}</RemovedSpan>
              </Tooltip>
            );
          } else {
            return <span key={index}>{part.value}</span>;
          }
        })}
      </Typography>
    );
  };

  // Synchronized scrolling
  useEffect(() => {
    const handleGeneratedScroll = () => {
      if (isSyncingScroll) return;
      setIsSyncingScroll(true);
      if (humanizedRef.current) {
        humanizedRef.current.scrollTop = generatedRef.current.scrollTop;
      }
      setIsSyncingScroll(false);
    };

    const handleHumanizedScroll = () => {
      if (isSyncingScroll) return;
      setIsSyncingScroll(true);
      if (generatedRef.current) {
        generatedRef.current.scrollTop = humanizedRef.current.scrollTop;
      }
      setIsSyncingScroll(false);
    };

    const genScroll = generatedRef.current;
    const humScroll = humanizedRef.current;

    if (genScroll && humScroll) {
      genScroll.addEventListener('scroll', handleGeneratedScroll);
      humScroll.addEventListener('scroll', handleHumanizedScroll);
    }

    return () => {
      if (genScroll && humScroll) {
        genScroll.removeEventListener('scroll', handleGeneratedScroll);
        humScroll.removeEventListener('scroll', handleHumanizedScroll);
      }
    };
  }, [isSyncingScroll]);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth>
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
                ref={generatedRef}
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '16px',
                  height: '400px',
                  overflowY: 'auto',
                  backgroundColor: '#f9f9f9',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                }}
              >
                <Typography
                  variant="body1"
                  component="div"
                  dangerouslySetInnerHTML={{ __html: sanitizeContent(content) }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Humanized Content</strong>
              </Typography>
              <Box
                ref={humanizedRef}
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '16px',
                  height: '400px',
                  overflowY: 'auto',
                  backgroundColor: '#f1f1f1',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                }}
              >
                <Typography
                  variant="body1"
                  component="div"
                  dangerouslySetInnerHTML={{ __html: sanitizeContent(humanizedContent) }}
                />
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
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
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
