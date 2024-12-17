import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tabs,
  Tab,
  Typography,
  Box,
  Skeleton,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const OverviewPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  const projectColumns = [
    { field: 'project_name', headerName: 'Project Name', flex: 1, sortable: true, filterable: true },
    { field: 'number_of_keywords', headerName: 'Number of Keywords', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'today_avg', headerName: 'Today Avg', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'yesterday_avg', headerName: 'Yesterday Avg', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'total_up', headerName: 'Total Up', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'total_down', headerName: 'Total Down', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'top5', headerName: 'Top 5', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'top10', headerName: 'Top 10', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'top30', headerName: 'Top 30', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'visibility', headerName: 'Visibility', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'visibility_percent', headerName: 'Visibility %', flex: 1, type: 'number', sortable: true, filterable: true },
  ];

  const keywordColumns = [
    { field: 'project_name', headerName: 'Project Name', flex: 1, sortable: true, filterable: true },
    { field: 'search_engine_name', headerName: 'Search Engine', flex: 1, sortable: true, filterable: true },
    { field: 'keyword', headerName: 'Keyword', flex: 1, sortable: true, filterable: true },
    { field: 'current_ranking', headerName: 'Current Ranking', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'previous_ranking', headerName: 'Previous Ranking', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'pos', headerName: 'Pos', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'change_value', headerName: 'Change', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'is_map', headerName: 'Is Map', flex: 1, type: 'boolean', sortable: true, filterable: true },
    { field: 'map_position', headerName: 'Map Pos', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'volume', headerName: 'Volume', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'competition', headerName: 'Competition', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'suggested_bid', headerName: 'Suggested Bid', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'cpc', headerName: 'CPC', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'results', headerName: 'Results', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'kei', headerName: 'KEI', flex: 1, type: 'number', sortable: true, filterable: true },
    { field: 'total_sum', headerName: 'Total Sum', flex: 1, type: 'number', sortable: true, filterable: true },
    {
      field: 'ranking_url',
      headerName: 'Ranking URL',
      flex: 2,
      sortable: true,
      filterable: true,
      renderCell: (params) =>
        params.value ? (
          <a href={params.value} target="_blank" rel="noopener noreferrer">
            {params.value}
          </a>
        ) : (
          '-'
        ),
    },
  ];

  useEffect(() => {
    if (tabValue === 1) {
      // Fetch projects
      setLoadingProjects(true);
      axios
        .get('/api/keywords/seranking/overviewProjects')
        .then((res) => {
          // Add an id field for DataGrid
          const data = res.data.projects.map((p) => ({ id: p.project_id, ...p }));
          setProjects(data);
          setLoadingProjects(false);
        })
        .catch((err) => {
          console.error('Error fetching projects:', err);
          setLoadingProjects(false);
        });
    } else {
      // Fetch keywords
      setLoadingKeywords(true);
      axios
        .get('/api/keywords/seranking/overviewKeywords')
        .then((res) => {
          const data = res.data.keywords.map((k) => ({ id: k.keyword_id, ...k }));
          setKeywords(data);
          setLoadingKeywords(false);
        })
        .catch((err) => {
          console.error('Error fetching keywords:', err);
          setLoadingKeywords(false);
        });
    }
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Keywords Overview
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Show Keywords" />
        <Tab label="Show Projects" />
      </Tabs>

      {/* Show Keywords Tab */}
      {tabValue === 0 && (
        <Box mt={3} height={600}>
          {loadingKeywords ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <Paper style={{ height: '100%', width: '100%' }}>
              <DataGrid
                rows={keywords}
                columns={keywordColumns}
                pageSize={25}
                rowsPerPageOptions={[25, 50, 100]}
                filterMode="client"
                sortingMode="client"
                disableColumnMenu={false}
                disableDensitySelector
                disableColumnSelector={false}
                autoHeight={false}
              />
            </Paper>
          )}
        </Box>
      )}

      {/* Show Projects Tab */}
      {tabValue === 1 && (
        <Box mt={3} height={600}>
          {loadingProjects ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <Paper style={{ height: '100%', width: '100%' }}>
              <DataGrid
                rows={projects}
                columns={projectColumns}
                pageSize={25}
                rowsPerPageOptions={[25, 50, 100]}
                filterMode="client"
                sortingMode="client"
                disableColumnMenu={false}
                disableDensitySelector
                disableColumnSelector={false}
                autoHeight={false}
              />
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default OverviewPage;
