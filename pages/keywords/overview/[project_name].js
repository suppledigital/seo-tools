// pages/overview/[project_name].js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress } from '@mui/material';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';

// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const keywordColumns = [
  { field: 'keyword', headerName: 'Keyword', flex: 1 },
  { field: 'current_ranking', headerName: 'Current Ranking', flex: 1, type: 'number' },
  { field: 'previous_ranking', headerName: 'Previous Ranking', flex: 1, type: 'number' },
];

const MetricBox = ({ title, value }) => (
  <Card sx={{ minWidth: 150, minHeight: 80, height:150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <CardContent sx={{ textAlign: 'center' }}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Typography variant="h6">{value}</Typography>
    </CardContent>
  </Card>
);

const ProjectOverviewPage = () => {
  const router = useRouter();
  const { project_name } = router.query;
  
  const [projectDetails, setProjectDetails] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recheckLoading, setRecheckLoading] = useState(false);

  useEffect(() => {
    if (!project_name) return;
    (async () => {
      try {
        const projectRes = await axios.get(`/api/keywords/projects?name=${encodeURIComponent(project_name)}`);
        const project = projectRes.data;
        
        const keywordsRes = await axios.get(`/api/keywords/keywords?project_id=${project.project_id}`);
        
        setProjectDetails(project);
        const keywordData = keywordsRes.data.map(k => ({ id: k.keyword_id, ...k }));
        setKeywords(keywordData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    })();
  }, [project_name]);

  const handleRescan = async () => {
    if (!projectDetails) return;
    setRecheckLoading(true);
    try {
      const res = await axios.post('/api/keywords/seranking/recheck', {
        project_id: projectDetails.project_id
      });
      alert(`Rescan initiated for ${res.data.total} keywords.`);
    } catch (err) {
      console.error(err);
      alert('Failed to initiate rescan. Check console for details.');
    }
    setRecheckLoading(false);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h6">Loading project details...</Typography>
      </Box>
    );
  }

  if (!projectDetails) {
    return (
      <Box p={3}>
        <Typography variant="h6">Project not found</Typography>
      </Box>
    );
  }

  const {
    project_name: pName,
    number_of_keywords,
    today_avg,
    yesterday_avg,
    total_up,
    total_down,
    top5,
    top10,
    top30,
    visibility,
    visibility_percent
  } = projectDetails;

  // Prepare data for pie chart
  const top5Count = top5;
  const top10Count = top10 - top5;
  const top30Count = top30 - top10;
  const beyond30Count = number_of_keywords - top30;

  const pieData = {
    labels: ['Top 1-5', 'Top 6-10', 'Top 11-30', 'Beyond 30'],
    datasets: [
      {
        data: [top5Count, top10Count, top30Count, beyond30Count],
        backgroundColor: ['#4caf50', '#ffeb3b', '#2196f3', '#f44336'],
      },
    ],
  };

  const pieOptions = {
    responsive: true, // Turn off responsive to fix size
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>{pName} Overview</Typography>
        <Button variant="contained" color="primary" onClick={handleRescan} disabled={recheckLoading}>
          {recheckLoading ? 'Rescanning...' : 'Rescan Keywords'}
        </Button>
      </Box>

      {/* Metric Boxes Row */}
      <Box mb={2} >
        <Grid container spacing={2}>
          <Grid item><MetricBox title="Number of Keywords" value={number_of_keywords} /></Grid>
          <Grid item><MetricBox title="Today Avg" value={today_avg} /></Grid>
          <Grid item><MetricBox title="Yesterday Avg" value={yesterday_avg} /></Grid>
          
          {/* Combine Total Up/Down */}
          <Grid item>
            <Card sx={{ minWidth: 150, minHeight: 80, height:150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>Ranking Movement</Typography>
                <Typography variant="body1">Up: {total_up} | Down: {total_down}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Combine top5, top10, top30 */}
          <Grid item>
            <Card sx={{ minWidth: 150, minHeight: 80, height:150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>Rank Distribution</Typography>
                <Typography variant="body1">Top5: {top5} | Top10: {top10} | Top30: {top30}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item><MetricBox sx={{ height:150 }}title="Traffic Forecast" value={visibility} /></Grid>

          {/* Visibility Percent as a Circular Chart */}
          <Grid item>
            <Card sx={{ minWidth: 150, minHeight: 80, height:150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{textAlign: 'center'}}>
                <Typography variant="subtitle1" gutterBottom>Visibility %</Typography>
                <Box position="relative" display="inline-flex">
                  <CircularProgress variant="determinate" value={Number(visibility_percent)} size={60} />
                  <Box
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="caption" component="div" color="textSecondary">{`${visibility_percent}%`}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box display="flex" gap={2} mt={2}>
        {/* Left Container: Keywords Table */}
        <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" gutterBottom>Keywords & Rankings</Typography>
          {keywords.length === 0 ? (
            <Typography>No keywords found.</Typography>
          ) : (
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 400 }}>
              <DataGrid
                rows={keywords}
                columns={keywordColumns}
                pageSize={25}
                rowsPerPageOptions={[25, 50, 100]}
                autoHeight={false}
              />
            </Box>
          )}
        </Paper>

        {/* Right Container: Charts (Pie Chart for Position Distribution) */}
        <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: '', justifyContent: '' }}>
          <Typography variant="h5" gutterBottom>Position Distribution</Typography>
          <Box width={500} height={500}>
            <Pie data={pieData} options={pieOptions} />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ProjectOverviewPage;
