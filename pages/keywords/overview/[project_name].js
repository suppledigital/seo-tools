// pages/overview/[project_name].js
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button,
  CircularProgress, MenuItem, Select, FormControl, InputLabel, Tabs, Tab,
  Checkbox, FormControlLabel, IconButton, Collapse
} from '@mui/material';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

ChartJS.register(ArcElement, Tooltip, Legend);

const keywordColumnsBrief = [
  { field: 'keyword', headerName: 'Keyword', flex: 1 },
  {
    field: 'current_ranking',
    headerName: 'Current Ranking',
    flex: 1,
    type: 'number',
    renderCell: (params) => {
      const { row } = params;
      let arrow = '';
      if (row.change_value > 0) arrow = '▲';
      else if (row.change_value < 0) arrow = '▼';
      else arrow = '⇔';
      return (
        <Box display='flex' alignItems='center' gap={1}>
          <Typography>{row.current_ranking}</Typography>
          <Typography color={row.change_value > 0 ? 'green' : row.change_value < 0 ? 'red' : 'inherit'}>
            {arrow}
          </Typography>
        </Box>
      );
    }
  }
];

const MetricBox = ({ title, value }) => (
  <Card sx={{ minWidth: 150, minHeight:80, height:150, display:'flex', alignItems:'center', justifyContent:'center' }}>
    <CardContent sx={{textAlign:'center'}}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Typography variant="h6">{value}</Typography>
    </CardContent>
  </Card>
);

export default function ProjectOverviewPage() {
  const router = useRouter();
  const { project_name } = router.query;

  const [tabValue, setTabValue] = useState(0); // 0=Brief,1=Historical
  const [projectDetails, setProjectDetails] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [searchEngines, setSearchEngines] = useState([]);
  const [selectedEngine, setSelectedEngine] = useState(null);

  const [loading, setLoading] = useState(true);
  const [recheckLoading, setRecheckLoading] = useState(false);

  // Historical states
  const [historicalData, setHistoricalData] = useState([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalCache, setHistoricalCache] = useState({});
  const [historicalColumns, setHistoricalColumns] = useState([]);
  const [historicalRows, setHistoricalRows] = useState([]);
  const [allDates, setAllDates] = useState([]);

  const [exploreData, setExploreData] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [compareMode, setCompareMode] = useState('none');
  const [compareDate, setCompareDate] = useState(null);

  // Collapse metrics initially
  const [metricsOpen, setMetricsOpen] = useState(false);

  useEffect(() => {
    if (project_name) {
      initialFetch(project_name);
    }
  }, [project_name]);

  const initialFetch = async (name) => {
    setLoading(true);
    try {
      const projectRes = await axios.get(`/api/keywords/projects?name=${encodeURIComponent(name)}`);
      const project = projectRes.data;
      setProjectDetails(project);

      const seRes = await axios.get(`/api/keywords/search-engines?project_id=${project.project_id}`);
      setSearchEngines(seRes.data);

      if (seRes.data.length > 0) {
        const engine_id = seRes.data[0].site_engine_id;
        setSelectedEngine(engine_id);
        await fetchData(engine_id);
      } else {
        await fetchData(null);
      }

      setLoading(false);
    } catch(err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchData = async (engine_id = null, date = null, compDate = null) => {
    if (!projectDetails) return;
    setLoading(true);
    try {
      let projectUrl = `/api/keywords/projects?name=${encodeURIComponent(projectDetails.project_name)}`;
      if (engine_id) projectUrl += `&search_engine_id=${engine_id}`;

      const projectRes = await axios.get(projectUrl);
      const project = projectRes.data;

      let kwUrl = `/api/keywords/keywords?project_id=${project.project_id}`;
      if (engine_id) kwUrl += `&search_engine_id=${engine_id}`;

      const keywordsRes = await axios.get(kwUrl);
      let keywordData = keywordsRes.data.map(k => ({ id:k.keyword_id, ...k }));

      // If exploreData mode is on and we have historical data and a selected date,
      // adjust current_ranking and change_value based on historical data
      if (exploreData && historicalData.length > 0 && selectedDate) {
        const histSet = new Set(historicalData.map(d=>d.date));
        if (!histSet.has(selectedDate)) {
          // If selectedDate not in historical, reset it
          setSelectedDate(null);
        } else {
          // Adjust current rankings based on selectedDate
          keywordData = keywordData.map(kw => {
            const histRecord = historicalData.find(h => h.keyword===kw.keyword && h.date===selectedDate);
            kw.current_ranking = histRecord ? histRecord.pos : 0;
            // If compareMode enabled and compareDate selected
            if (compareMode!=='none' && compareDate) {
              const oldRecord = historicalData.find(h=>h.keyword===kw.keyword && h.date===compareDate);
              const oldPos = oldRecord ? oldRecord.pos : kw.current_ranking;
              kw.change_value = (oldPos - kw.current_ranking);
            }
            return kw;
          });
        }
      }

      setProjectDetails(project);
      setKeywords(keywordData);
      setLoading(false);
    } catch(err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (engine_id) => {
    if (!projectDetails) return;
    setHistoricalLoading(true);
    const key = `${projectDetails.project_id}-${engine_id || 'all'}`;
    if (historicalCache[key]) {
      pivotHistoricalData(historicalCache[key]);
      setHistoricalLoading(false);
      return;
    }

    try {
      let histUrl = `/api/keywords/historical?project_id=${projectDetails.project_id}`;
      if (engine_id) histUrl += `&search_engine_id=${engine_id}`;

      const histRes = await axios.get(histUrl);
      const data = histRes.data;
      setHistoricalCache({...historicalCache, [key]: data});
      pivotHistoricalData(data);
    } catch(err) {
      console.error(err);
      alert('Failed to fetch historical data.');
    }
    setHistoricalLoading(false);
  };

  const pivotHistoricalData = (data) => {
    if (data.length === 0) {
      setHistoricalData([]);
      setHistoricalColumns([]);
      setHistoricalRows([]);
      setAllDates([]);
      return;
    }

    // Sort dates descending so latest first
    let dates = [...new Set(data.map(d => d.date))].sort((a,b)=>b.localeCompare(a));
    const allKeywords = [...new Set(data.map(d => d.keyword))].sort();

    const columns = [
      { field: 'keyword', headerName: 'Keyword', flex: 1, minWidth: 150 }
    ].concat(dates.map(date => ({
      field: date,
      headerName: date,
      type: 'number',
      flex: 1,
      minWidth: 120
    })));

    const rows = allKeywords.map(keyword => {
      const row = { id: keyword, keyword };
      for (const date of dates) {
        const record = data.find(r => r.keyword === keyword && r.date === date);
        row[date] = record ? record.pos : null;
      }
      return row;
    });

    setHistoricalData(data);
    setHistoricalColumns(columns);
    setHistoricalRows(rows);
    setAllDates(dates);
  };

  const handleRescan = async () => {
    if (!projectDetails) return;
    setRecheckLoading(true);
    try {
      const res = await axios.post('/api/keywords/seranking/recheck', {
        project_id: projectDetails.project_id
      });
      alert(`Rescan initiated for ${res.data.total} keywords.`);

      setTimeout(() => { fetchData(selectedEngine); }, 10000);
      setTimeout(() => { fetchData(selectedEngine); }, 20000);

    } catch(err) {
      console.error(err);
      alert('Failed to initiate rescan.');
    }
    setRecheckLoading(false);
  };

  const pollResults = async () => {
    await fetchData(selectedEngine, selectedDate, compareDate);
  };

  const handleEngineChange = async (event) => {
    const engine_id = event.target.value;
    setSelectedEngine(engine_id);
    if (tabValue === 0) {
      await fetchData(engine_id, selectedDate, compareDate);
    } else {
      await fetchHistoricalData(engine_id);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      await fetchData(selectedEngine, selectedDate, compareDate);
    } else {
      await fetchHistoricalData(selectedEngine);
    }
  };

  const shouldDisableDate = (day) => {
    const dayStr = day.format('YYYY-MM-DD');
    const allDatesSet = new Set(allDates);
    return !allDatesSet.has(dayStr);
  };

  const handleExploreChange = async (e) => {
    const checked = e.target.checked;
    setExploreData(checked);
    if (checked && historicalData.length===0 && selectedEngine) {
      setHistoricalLoading(true);
      await fetchHistoricalData(selectedEngine);
      setHistoricalLoading(false);
    }
  };

  const handleDateChange = async (newValue) => {
    const dateStr = newValue ? newValue.format('YYYY-MM-DD'):null;
    setSelectedDate(dateStr);
    await fetchData(selectedEngine, dateStr, compareDate);
  };

  const handleCompareModeChange = async (e) => {
    const val = e.target.value;
    setCompareMode(val);
    if (val==='none') {
      setCompareDate(null);
      await fetchData(selectedEngine, selectedDate, null);
    } else if(val==='previous_year' && selectedDate) {
      const prevYear = dayjs(selectedDate).subtract(1,'year').format('YYYY-MM-DD');
      setCompareDate(prevYear);
      await fetchData(selectedEngine, selectedDate, prevYear);
    } else if(val==='previous_month' && selectedDate) {
      const prevMonth = dayjs(selectedDate).subtract(1,'month').format('YYYY-MM-DD');
      setCompareDate(prevMonth);
      await fetchData(selectedEngine, selectedDate, prevMonth);
    }
    // custom handled by handleCompareDateChange
  };

  const handleCompareDateChange = async (newValue) => {
    const dateStr = newValue ? newValue.format('YYYY-MM-DD'):null;
    setCompareDate(dateStr);
    await fetchData(selectedEngine, selectedDate, dateStr);
  };

  const generatePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.text("Report",10,10);
    doc.text(`Project: ${projectDetails.project_name}`,10,20);
    let yPos=30;
    doc.text("Keywords Rankings:",10,yPos);
    yPos+=10;
    keywords.forEach(kw=>{
      doc.text(`${kw.keyword}: ${kw.current_ranking} (Change: ${kw.change_value})`,10,yPos);
      yPos+=10;
    });
    doc.save("report.pdf");
  };

  if (loading) {
    return (<Box p={3}><Typography variant="h6">Loading project details...</Typography></Box>);
  }

  if (!projectDetails) {
    return (<Box p={3}><Typography variant="h6">Project not found</Typography></Box>);
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

  const top5Count = top5;
  const top10Count = top10 - top5;
  const top30Count = top30 - top10;
  const beyond30Count = number_of_keywords - top30;

  const pieData = {
    labels: ['Top 1-5','Top 6-10','Top 11-30','Beyond 30'],
    datasets:[{
      data:[top5Count, top10Count, top30Count, beyond30Count],
      backgroundColor:['#4caf50','#ffeb3b','#2196f3','#f44336'],
    }],
  };

  const pieOptions = { responsive:true,   plugins:{legend:{position:'bottom'}} };

  return (
    <Box p={3}>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>{pName} Overview</Typography>
        <Box display="flex" gap={2}>
          <Button variant="contained" onClick={generatePDF}>Download Report</Button>
          <Button variant="contained" color="primary" onClick={handleRescan} disabled={recheckLoading}>
            {recheckLoading ? 'Rescanning...' : 'Rescan Keywords'}
          </Button>
        </Box>
      </Box>

      {searchEngines.length > 0 && (
        <Box mb={2} width={200}>
          <FormControl fullWidth>
            <InputLabel id="search-engine-select-label">Search Engine</InputLabel>
            <Select
              labelId="search-engine-select-label"
              value={selectedEngine ?? (searchEngines[0]?.site_engine_id)}
              label="Search Engine"
              onChange={handleEngineChange}
            >
              {searchEngines.map(se => (
                <MenuItem key={se.site_engine_id} value={se.site_engine_id}>{se.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Brief"/>
        <Tab label="Historical"/>
      </Tabs>

      {tabValue === 0 && (
        <Box mt={2}>
          {/* Collapsible metrics */}
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <IconButton
              onClick={()=>setMetricsOpen(!metricsOpen)}
              sx={{
                transform: metricsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition:'transform 0.2s'
              }}
            >
              <ExpandMoreIcon/>
            </IconButton>
            <Typography variant="h6">Show Summary</Typography>
          </Box>

          <Collapse in={metricsOpen}>
            <Box mb={2}>
              <Grid container spacing={2}>
                <Grid item><MetricBox title="Number of Keywords" value={number_of_keywords}/></Grid>
                <Grid item><MetricBox title="Today Avg" value={today_avg}/></Grid>
                <Grid item><MetricBox title="Yesterday Avg" value={yesterday_avg}/></Grid>
                <Grid item>
                  <Card sx={{ minWidth:150,minHeight:80,height:150,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <CardContent sx={{textAlign:'center'}}>
                      <Typography variant="subtitle1" gutterBottom>Ranking Movement</Typography>
                      <Typography>Up: {total_up} | Down: {total_down}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item>
                  <Card sx={{minWidth:150,minHeight:80,height:150,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <CardContent sx={{textAlign:'center'}}>
                      <Typography variant="subtitle1" gutterBottom>Rank Distribution</Typography>
                      <Typography>Top5: {top5} | Top10: {top10} | Top30: {top30}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item><MetricBox title="Traffic Forecast" value={visibility}/></Grid>
                <Grid item>
                  <Card sx={{minWidth:150,minHeight:80,height:150,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                    <CardContent sx={{textAlign:'center'}}>
                      <Typography variant="subtitle1" gutterBottom>Visibility %</Typography>
                      <Box position="relative" display="inline-flex">
                        <CircularProgress variant="determinate" value={Number(visibility_percent)} size={60}/>
                        <Box top={0}left={0}bottom={0}right={0}position='absolute'display='flex'alignItems='center'justifyContent='center'>
                          <Typography variant="caption" component="div" color="textSecondary">
                            {`${visibility_percent}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Collapse>

          <FormControlLabel
            control={<Checkbox checked={exploreData} onChange={async(e)=>{
              const checked = e.target.checked;
              setExploreData(checked);
              if(checked && historicalData.length===0 && selectedEngine){
                setHistoricalLoading(true);
                await fetchHistoricalData(selectedEngine);
                setHistoricalLoading(false);
              }
            }}/>}
            label="Explore Data"
          />

          {exploreData && (
            historicalLoading ? (
              <Box display="flex" alignItems="center" gap={1} mt={2}>
                <CircularProgress size={20}/>
                <Typography>Loading historical data...</Typography>
              </Box>
            ) : (
              historicalData.length>0 ? (
                <Box display="flex" gap={2} alignItems="center" mb={2} mt={2}>
                  <Typography>Select Date:</Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date"
                      value={selectedDate ? dayjs(selectedDate):null}
                      onChange={async(newValue)=>{
                        const dateStr = newValue ? newValue.format('YYYY-MM-DD') : null;
                        setSelectedDate(dateStr);
                        await fetchData(selectedEngine, dateStr, compareDate);
                      }}
                      shouldDisableDate={(day)=>{
                        const dayStr = day.format('YYYY-MM-DD');
                        const dateset = new Set(allDates);
                        return !dateset.has(dayStr);
                      }}
                    />
                  </LocalizationProvider>

                  <Typography>Comparison:</Typography>
                  <Select value={compareMode} onChange={async(e)=>{
                    const val = e.target.value;
                    setCompareMode(val);
                    if(val==='none') {
                      setCompareDate(null);
                      await fetchData(selectedEngine, selectedDate, null);
                    } else if(val==='previous_year' && selectedDate) {
                      const prevYear = dayjs(selectedDate).subtract(1,'year').format('YYYY-MM-DD');
                      setCompareDate(prevYear);
                      await fetchData(selectedEngine, selectedDate, prevYear);
                    } else if(val==='previous_month' && selectedDate) {
                      const prevMonth = dayjs(selectedDate).subtract(1,'month').format('YYYY-MM-DD');
                      setCompareDate(prevMonth);
                      await fetchData(selectedEngine, selectedDate, prevMonth);
                    }
                    // custom handled below
                  }}>
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="previous_year">Previous Year</MenuItem>
                    <MenuItem value="previous_month">Previous Month</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>

                  {compareMode==='custom' && (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Compare Date"
                        value={compareDate ? dayjs(compareDate):null}
                        onChange={async(newValue)=>{
                          const dateStr = newValue ? newValue.format('YYYY-MM-DD'):null;
                          setCompareDate(dateStr);
                          await fetchData(selectedEngine, selectedDate, dateStr);
                        }}
                        shouldDisableDate={(day)=>{
                          const dayStr = day.format('YYYY-MM-DD');
                          const dateset = new Set(allDates);
                          return !dateset.has(dayStr);
                        }}
                      />
                    </LocalizationProvider>
                  )}
                </Box>
              ) : (
                <Typography mt={2}>No historical data available.</Typography>
              )
            )
          )}

          <Box display="flex" gap={2} mt={2}>
            <Paper sx={{flex:1,p:2,display:'flex',flexDirection:'column'}}>
              <Typography variant="h5" gutterBottom>Keywords & Rankings (Brief)</Typography>
              {keywords.length ===0 ? (
                <Typography>No keywords found.</Typography>
              ) : (
                <Box sx={{flex:1,overflowY:'auto',minHeight:400}}>
                  <DataGrid
                    rows={keywords}
                    columns={keywordColumnsBrief}
                    pageSize={25}
                    rowsPerPageOptions={[25,50,100]}
                    autoHeight={false}
                  />
                </Box>
              )}
            </Paper>

            <Paper sx={{flex:1,p:2}}>
              <Typography variant="h5" gutterBottom>Position Distribution</Typography>
              <Box width={400} height={400}>
                <Pie data={pieData} options={{responsive:true, plugins:{legend:{position:'bottom'},height:700,}}}/>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {tabValue===1 && (
        <Box display="flex" gap={2} mt={2}>
          <Paper sx={{flex:1,p:2,display:'flex',flexDirection:'column',overflow:'auto'}}>
            <Typography variant="h5" gutterBottom>Historical Data (5 years)</Typography>
            {historicalLoading ? (
              <Typography>Loading historical data...</Typography>
            ) : historicalRows.length===0 ? (
              <Typography>No historical data found.</Typography>
            ) : (
              <Box sx={{flex:1,overflow:'auto',minHeight:400}}>
                <DataGrid
                  rows={historicalRows}
                  columns={historicalColumns}
                  pageSize={25}
                  rowsPerPageOptions={[25,50,100]}
                  autoHeight={false}
                  sx={{width:'max-content',minWidth:'100%'}}
                />
              </Box>
            )}
          </Paper>
        </Box>
      )}

    </Box>
  );
}
