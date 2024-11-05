// components/competitor-analysis/CompetitorAnalysis.js

import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js';
import styles from './CompetitorAnalysis.module.css';
import dynamic from 'next/dynamic';
import Select from 'react-select';

// Dynamically import DataTable with SSR disabled
const DataTable = dynamic(() => import('react-data-table-component'), { ssr: false });

import axios from 'axios';

const CompetitorAnalysis = ({
  overviewData,
  allCompetitors,
}) => {
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [selectedCompetitorDomains, setSelectedCompetitorDomains] = useState([]);
  const [dataCache, setDataCache] = useState({}); // Cache for history data
  const [selectedMetric, setSelectedMetric] = useState('traffic_sum');
  const [dateRange, setDateRange] = useState('12'); // Default to 12 months
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDomain, setLoadingDomain] = useState(null); // New state to track loading domain

  const competitivePositioningChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const chartInstances = useRef({});

  // Prepare options for react-select
  const competitorOptions = [
    { value: overviewData.overview.organic.base_domain, label: overviewData.overview.organic.base_domain },
    ...allCompetitors.map(c => ({ value: c.domain, label: c.domain })),
  ];

  // Initialize default selected competitors (4 competitors + client's domain)
  useEffect(() => {
    const defaultCompetitors = [overviewData.overview.organic.base_domain, ...allCompetitors.map(c => c.domain)].slice(0, 5);
    setSelectedCompetitorDomains(defaultCompetitors);
    setSelectedCompetitors(defaultCompetitors);
  }, [overviewData, allCompetitors]);

  // Fetch history data only for new competitors
  useEffect(() => {
    const fetchHistoryData = async () => {
      const domainsToFetch = selectedCompetitors.filter(domain => !dataCache[domain]);

      if (domainsToFetch.length === 0) {
        // All data already fetched, render the chart
        renderTrendChart();
        return;
      }

      setLoadingHistory(true);

      const newDataCache = { ...dataCache };

      for (const domain of domainsToFetch) {
        setLoadingDomain(domain); // Set current loading domain
        try {
          const response = await axios.get(`/api/audit/overview/history?domain=${encodeURIComponent(domain)}&type=organic`);
          newDataCache[domain] = response.data;
          setDataCache({ ...newDataCache }); // Update dataCache with new data
          renderTrendChart(); // Update chart after each domain's data is fetched
        } catch (error) {
          console.error(`Error fetching history for ${domain}:`, error);
          newDataCache[domain] = []; // Assign empty data to avoid undefined errors
          setDataCache({ ...newDataCache });
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before next request
      }
      setLoadingDomain(null); // Reset loading domain
      setLoadingHistory(false);
    };

    fetchHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetitors]);

  // Re-render the chart when metric or date range changes
  useEffect(() => {
    renderTrendChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetric, dateRange]);

  const renderTrendChart = () => {
    if (trendChartRef.current && selectedCompetitors.length > 0) {
      // Determine the time range based on dateRange selection
      const monthsToShow = dateRange === 'All' ? Infinity : parseInt(dateRange);

      // Generate labels and datasets
      const labelsSet = new Set();
      const datasets = [];

      // Generate a color palette
      const colorPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#C9CBCF', '#7BDCB5', '#F990C0', '#F9C851',
      ];

      selectedCompetitors.forEach((domain, idx) => {
        const history = dataCache[domain];
        if (!history || history.length === 0) return; // Data not available yet

        // Map history data to the selected metric
        const metricData = history.map(item => ({
          date: new Date(item.year, item.month - 1),
          value: item[selectedMetric] || 0,
        }));

        // Sort by date
        metricData.sort((a, b) => a.date - b.date);

        // Limit data based on monthsToShow
        const limitedData = monthsToShow !== Infinity ? metricData.slice(-monthsToShow) : metricData;

        // Add labels
        limitedData.forEach(item => labelsSet.add(item.date.getTime())); // Use timestamp to avoid duplicate dates

        datasets.push({
          label: domain,
          data: limitedData.map(item => item.value),
          borderColor: colorPalette[idx % colorPalette.length],
          fill: false,
        });
      });

      // Convert labelsSet to array and sort
      const labelsArray = Array.from(labelsSet).sort((a, b) => a - b).map(timestamp => new Date(timestamp));
      const labels = labelsArray.map(date => `${date.getMonth() + 1}/${date.getFullYear()}`);

      // Adjust datasets to match labels
      datasets.forEach(dataset => {
        const dataMap = {};
        const domain = dataset.label;
        const history = dataCache[domain];
        if (!history || history.length === 0) return;
        const metricData = history.map(item => ({
          date: new Date(item.year, item.month - 1).getTime(),
          value: item[selectedMetric] || 0,
        }));
        metricData.forEach(item => {
          dataMap[item.date] = item.value;
        });
        dataset.data = labelsArray.map(date => dataMap[date.getTime()] || 0);
      });

      if (chartInstances.current['trendChart']) {
        // Update existing chart
        chartInstances.current['trendChart'].data.labels = labels;
        chartInstances.current['trendChart'].data.datasets = datasets;
        chartInstances.current['trendChart'].update();
      } else {
        // Create new chart
        const ctx = trendChartRef.current.getContext('2d');
        chartInstances.current['trendChart'] = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets,
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || '';
                    const value = context.formattedValue;
                    return `${label}: ${value}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  drawBorder: false, // Hide x-axis border line
                  drawOnChartArea: false, // Ensure grid lines are not drawn on the chart area
                  drawTicks: false, // Optional: hide tick marks
                },
                ticks: {
                  display: true,
                },
                title: {
                  display: true,
                  text: 'Month/Year',
                },
              },
              y: {
                grid: {
                  display: true,
                  drawBorder: false, // Hide y-axis border line if desired
                },
                ticks: {
                  display: true,
                },
                title: {
                  display: true,
                  text: selectedMetric,
                },
                beginAtZero: true,
              },
            },
          },
        });
      }
    }
  };



  const renderCompetitivePositioningChart = () => {
    if (
      competitivePositioningChartRef.current &&
      overviewData &&
      overviewData.overview &&
      overviewData.overview.organic
    ) {
      const ctx = competitivePositioningChartRef.current.getContext('2d');
      if (chartInstances.current['competitivePositioningChart']) {
        chartInstances.current['competitivePositioningChart'].destroy();
      }
  
      const userDomain = overviewData.overview.organic.base_domain || 'Your Domain';
      const userTotalKeywords = overviewData.overview.organic.keywords_count || 0;
      const ownOrganicTrafficSum = overviewData.overview.organic.traffic_sum || 1; // Prevent division by zero
  
      // Calculate total organic traffic including selected competitors
      const selectedCompData = allCompetitors.filter((c) =>
        selectedCompetitorDomains.includes(c.domain)
      );
      const totalOrganicTraffic =
        ownOrganicTrafficSum +
        selectedCompData.reduce((acc, c) => acc + (c.traffic_sum || 0), 0);
  
      // Prepare data points
      const allDataPoints = [];
  
      // Generate unique colors for each competitor and your domain
      const colorPalette = [
        'rgba(255, 99, 132, 0.7)', // Red
        'rgba(54, 162, 235, 0.7)', // Blue
        'rgba(255, 206, 86, 0.7)', // Yellow
        'rgba(75, 192, 192, 0.7)', // Teal
        'rgba(153, 102, 255, 0.7)', // Purple
        'rgba(255, 159, 64, 0.7)', // Orange
        'rgba(201, 203, 207, 0.7)', // Grey
        'rgba(0, 204, 102, 0.7)', // Green
        'rgba(102, 102, 255, 0.7)', // Indigo
        'rgba(255, 102, 255, 0.7)', // Pink
      ];
  
      // Create data point for your own domain
      const ownTrafficPercentage =
        Number(((ownOrganicTrafficSum / totalOrganicTraffic) * 100).toFixed(2)) || 0;
  
      const ownDataPoint = {
        label: userDomain,
        x: userTotalKeywords,
        y: ownTrafficPercentage,
        trafficPercentage: ownTrafficPercentage,
      };
  
      allDataPoints.push(ownDataPoint);
  
      // Create data points for each selected competitor
      selectedCompData.forEach((c) => {
        const x = c.common_keywords || 0;
        const y =
          Number(((c.traffic_sum / totalOrganicTraffic) * 100).toFixed(2)) || 0;
  
        const dataPoint = {
          label: c.domain,
          x,
          y,
          trafficPercentage: y,
        };
  
        allDataPoints.push(dataPoint);
      });
  
      // Determine min and max traffic percentages for scaling radius
      const minRadius = 10; // Adjust minimum radius as desired
      const maxRadius = 40; // Adjust maximum radius as desired
  
      // Now, create datasets with radius based on traffic percentage
      const datasets = allDataPoints.map((dp, idx) => {
        // Calculate radius based on traffic percentage
        const r = minRadius + (dp.trafficPercentage / 100) * (maxRadius - minRadius);
  
        const color = colorPalette[idx % colorPalette.length];
  
        return {
          label: dp.label,
          data: [{ x: dp.x, y: dp.y, r }],
          backgroundColor: color,
          borderColor: color.replace('0.7', '1'),
          borderWidth: 1,
          hoverBackgroundColor: color.replace('0.7', '0.9'),
          hoverBorderColor: color.replace('0.7', '1'),
        };
      });
  
      chartInstances.current['competitivePositioningChart'] = new Chart(ctx, {
        type: 'bubble',
        data: {
          datasets,
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.dataset.label || '';
                  const x = context.raw.x;
                  const y = context.raw.y;
                  return `${label}: (${x} Keywords, ${y}% Traffic Share)`;
                },
              },
            },
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                boxWidth: 20,
                padding: 15,
                generateLabels: function (chart) {
                  const datasets = chart.data.datasets;
                  return datasets.map((dataset, idx) => ({
                    text: dataset.label,
                    fillStyle: dataset.backgroundColor,
                    strokeStyle: dataset.borderColor,
                    lineWidth: dataset.borderWidth,
                    hidden: false,
                    index: idx,
                  }));
                },
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Keywords',
              },
              beginAtZero: true,
            },
            y: {
              title: {
                display: true,
                text: 'Organic Traffic Share (%)',
              },
              beginAtZero: true,
              max: 100,
            },
          },
        },
      });
    }
  };
  

  // Re-render competitive positioning chart when selected competitors change
  useEffect(() => {
    renderCompetitivePositioningChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetitorDomains]);

  // Prepare data for the table
  const tableData = [
    // First row is self domain
    {
      domain: overviewData.overview?.organic?.base_domain || 'Your Domain',
      common_keywords: overviewData.overview?.organic?.keywords_count || 0,
      missing_keywords: 0,
      total_keywords: overviewData.overview?.organic?.keywords_count || 0,
      total_traffic: overviewData.overview?.organic?.traffic_sum || 0,
      total_traffic_cost: overviewData.overview?.organic?.price_sum || 0,
    },
    // Then the competitors
    ...allCompetitors.map((comp) => ({
      domain: comp.domain,
      common_keywords: comp.common_keywords || 0,
      missing_keywords: comp.missing_keywords || 0,
      total_keywords: comp.total_keywords || 0,
      total_traffic: comp.traffic_sum || 0,
      total_traffic_cost: comp.price_sum || 0,
    })),
  ];

  const columns = [
    {
      name: 'Domain',
      selector: row => row.domain,
      sortable: true,
    },
    {
      name: 'Common Keywords',
      selector: row => row.common_keywords,
      sortable: true,
    },
    {
      name: 'Missing Keywords',
      selector: row => row.missing_keywords,
      sortable: true,
    },
    {
      name: 'Total Keywords',
      selector: row => row.total_keywords,
      sortable: true,
    },
    {
      name: 'Total Traffic',
      selector: row => row.total_traffic,
      sortable: true,
    },
    {
      name: 'Total Traffic Cost',
      selector: row => row.total_traffic_cost,
      sortable: true,
      format: row => `$${row.total_traffic_cost.toFixed(2)}`,
    },
  ];
  

  const dateRangeOptions = ['6', '12', '18', '24', '30', '36', 'All'];
  const metricOptions = [
    { label: 'Total Traffic', value: 'traffic_sum' },
    { label: 'Keywords', value: 'keywords_count' },
    { label: 'Traffic Cost', value: 'price_sum' },
  ];
  return (
    <div className={styles.competitorAnalysis}>
      <h3>Competitor Analysis</h3>
      {/* Filter Container */}
      <div className={styles.filterContainer}>
        {/* Competitor Selection */}
        <div className={styles.filterItem}>
          <label>Select Competitors:</label>
          <Select
            isMulti
            options={competitorOptions}
            value={competitorOptions.filter(option => selectedCompetitorDomains.includes(option.value))}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions.map(option => option.value);
              setSelectedCompetitorDomains(selectedValues);
              setSelectedCompetitors(selectedValues);
            }}
            styles={{
              container: (provided) => ({
                ...provided,
                minWidth: '250px',
              }),
            }}
          />
        </div>
        {/* Metric and Date Range Selection */}
        <div className={styles.filterItem} style={{ gridColumn: 'span 4'}}>
          <label>Select Metric and Date Range:</label>
          <div className={styles.tabContainer}>
            <div className={styles.metricTabs}>
              {metricOptions.map((metric, idx) => (
                <button
                  key={idx}
                  className={selectedMetric === metric.value ? styles.activeTab : ''}
                  onClick={() => setSelectedMetric(metric.value)}
                >
                  {metric.label}
                </button>
              ))}
            </div>
            <div className={styles.dateRangeOptions}>
              {dateRangeOptions.map((range, idx) => (
                <button
                  key={idx}
                  className={dateRange === range ? styles.activeOption : ''}
                  onClick={() => setDateRange(range)}
                >
                  {range === 'All' ? 'All' : `${range}M`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
       {/* Trend Chart */}
      <div className={styles.chartContainer}>
        <canvas ref={trendChartRef} height="400"></canvas>
        {loadingHistory && (
          <p>Loading history data{loadingDomain ? ` for ${loadingDomain}` : '...'}</p>
        )}
      </div>
      {/* Row with Competitive Chart and Table */}
      <div className={styles.rowContainer}>
        <div className={styles.halfWidth}>
          <canvas ref={competitivePositioningChartRef}></canvas>
        </div>
        <div className={styles.halfWidth}>
          <DataTable
            columns={columns}
            data={tableData}
            pagination
            highlightOnHover
          />
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
