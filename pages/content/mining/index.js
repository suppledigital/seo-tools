// pages/content/mining/index.js

import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
  CircularProgress,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import axios from 'axios';

const MiningPage = () => {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('US'); // Default country
  const [yearMonth, setYearMonth] = useState('');
  const [keywordsList, setKeywordsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing keywords on component mount
  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const res = await axios.get('/api/content/mining/keywords');
      setKeywordsList(res.data);
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  const handleMine = async () => {
    if (!keyword.trim() || !country.trim()) return;
    setLoading(true);
    try {
      await axios.post('/api/content/mining/mine', { keyword, country, yearMonth });
      setKeyword('');
      setYearMonth('');
      fetchKeywords();
    } catch (error) {
      console.error('Error mining keyword:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Content Mining
      </Typography>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
        <TextField
          label="Enter Keyword"
          variant="outlined"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          fullWidth
        />
        <FormControl variant="outlined" style={{ minWidth: 120 }}>
          <InputLabel id="country-select-label">Country</InputLabel>
          <Select
            labelId="country-select-label"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            label="Country"
          >
            <MenuItem value="US">US</MenuItem>
            <MenuItem value="UK">UK</MenuItem>
            <MenuItem value="AU">AU</MenuItem>
            <MenuItem value="NZ">NZ</MenuItem>
            {/* Add more countries as needed */}
          </Select>
        </FormControl>
        <TextField
          label="YearMonth (YYYYMM)"
          variant="outlined"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          placeholder="Optional"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleMine}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Mine'}
        </Button>
      </div>

      {/* Table of Keywords */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Keyword</TableCell>
            <TableCell>Country</TableCell>
            <TableCell>YearMonth</TableCell>
            <TableCell>Date & Time</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {keywordsList.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.keyword}</TableCell>
              <TableCell>{item.country}</TableCell>
              <TableCell>{item.yearMonth || 'N/A'}</TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                {item.status === 'processing' ? (
                  <CircularProgress size={20} />
                ) : item.status === 'completed' ? (
                  'Completed'
                ) : (
                  'Failed'
                )}
              </TableCell>
              <TableCell>
                {item.status === 'completed' && (
                  <>
                    <Link href={`/txt/${item.fileName}`} target="_blank" rel="noopener">
                      View
                    </Link>
                    {' | '}
                    <Link href={`/txt/${item.fileName}`} download>
                      Download
                    </Link>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
};

export default MiningPage;
