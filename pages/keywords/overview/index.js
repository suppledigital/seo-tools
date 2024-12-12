// pages/keywords/overview/index.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tabs,
  Tab,
  Typography,
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const OverviewPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  useEffect(() => {
    if (tabValue === 1) {
      // Fetch projects when "Show Projects" tab is selected
      setLoadingProjects(true);
      axios
        .get('/api/keywords/seranking/overviewProjects')
        .then((res) => {
          setProjects(res.data.projects || []);
          setLoadingProjects(false);
        })
        .catch((err) => {
          console.error('Error fetching projects:', err);
          setLoadingProjects(false);
        });
    } else {
      // Fetch keywords when "Show Keywords" tab is selected
      setLoadingKeywords(true);
      axios
        .get('/api/keywords/seranking/overviewKeywords')
        .then((res) => {
          setKeywords(res.data.keywords || []);
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

  // Prepare data for chart
  // For simplicity, we just show a comparison of today_avg vs yesterday_avg for all projects
  const chartData = projects.map(proj => ({
    name: proj.project_name,
    today_avg: proj.today_avg || 0,
    yesterday_avg: proj.yesterday_avg || 0,
  }));

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
        <Box mt={3}>
          {loadingKeywords ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <Paper>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Search Engine</TableCell>
                    <TableCell>Keyword</TableCell>
                    <TableCell>Pos</TableCell>
                    <TableCell>Change</TableCell>
                    <TableCell>Volume</TableCell>
                    <TableCell>Competition</TableCell>
                    <TableCell>Suggested Bid</TableCell>
                    <TableCell>KEI</TableCell>
                    <TableCell>Total Sum</TableCell>
                    <TableCell>Is Map</TableCell>
                    <TableCell>Map Position</TableCell>
                    <TableCell>Ranking URL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keywords.map((kw) => (
                    <TableRow key={kw.keyword_id}>
                      <TableCell>{kw.project_name}</TableCell>
                      <TableCell>{kw.search_engine_name}</TableCell>
                      <TableCell>{kw.keyword}</TableCell>
                      <TableCell>{kw.pos !== null ? kw.pos : '-'}</TableCell>
                      <TableCell>{kw.change_value !== null ? kw.change_value : '-'}</TableCell>
                      <TableCell>{kw.volume !== null ? kw.volume : '-'}</TableCell>
                      <TableCell>{kw.competition !== null ? kw.competition : '-'}</TableCell>
                      <TableCell>{kw.suggested_bid !== null ? kw.suggested_bid : '-'}</TableCell>
                      <TableCell>{kw.kei !== null ? kw.kei : '-'}</TableCell>
                      <TableCell>{kw.total_sum !== null ? kw.total_sum : '-'}</TableCell>
                      <TableCell>{kw.is_map !== null ? (kw.is_map === 1 ? 'Yes' : 'No') : '-'}</TableCell>
                      <TableCell>{kw.map_position !== null ? kw.map_position : '-'}</TableCell>
                      <TableCell>
                        {kw.ranking_url ? (
                          <a href={kw.ranking_url} target="_blank" rel="noopener noreferrer">
                            {kw.ranking_url}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {keywords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={13}>No keywords available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      )}

      {/* Show Projects Tab */}
      {tabValue === 1 && (
        <Box mt={3}>
          {loadingProjects ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <>
              <Paper sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Number of Keywords</TableCell>
                      <TableCell>Today Avg</TableCell>
                      <TableCell>Yesterday Avg</TableCell>
                      <TableCell>Total Up</TableCell>
                      <TableCell>Total Down</TableCell>
                      <TableCell>Top 5</TableCell>
                      <TableCell>Top 10</TableCell>
                      <TableCell>Top 30</TableCell>
                      <TableCell>Visibility</TableCell>
                      <TableCell>Visibility %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((proj) => (
                      <TableRow key={proj.project_id}>
                        <TableCell>{proj.project_name}</TableCell>
                        <TableCell>{proj.number_of_keywords}</TableCell>
                        <TableCell>{proj.today_avg !== null ? proj.today_avg : '-'}</TableCell>
                        <TableCell>{proj.yesterday_avg !== null ? proj.yesterday_avg : '-'}</TableCell>
                        <TableCell>{proj.total_up !== null ? proj.total_up : '-'}</TableCell>
                        <TableCell>{proj.total_down !== null ? proj.total_down : '-'}</TableCell>
                        <TableCell>{proj.top5 !== null ? proj.top5 : '-'}</TableCell>
                        <TableCell>{proj.top10 !== null ? proj.top10 : '-'}</TableCell>
                        <TableCell>{proj.top30 !== null ? proj.top30 : '-'}</TableCell>
                        <TableCell>{proj.visibility !== null ? proj.visibility : '-'}</TableCell>
                        <TableCell>{proj.visibility_percent !== null ? proj.visibility_percent : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {projects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11}>No projects available.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>

              {/* Chart comparing today_avg and yesterday_avg */}
              <Typography variant="h5" gutterBottom>Average Position Comparison</Typography>
              <Paper sx={{ p: 2 }}>
                <Box width="100%" height={300}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="today_avg" stroke="#8884d8" name="Today Avg" />
                      <Line type="monotone" dataKey="yesterday_avg" stroke="#82ca9d" name="Yesterday Avg" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default OverviewPage;
