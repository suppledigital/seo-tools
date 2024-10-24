import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './index.module.css';
import { Chart, registerables } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import {
  faExclamationTriangle,
  faTimesCircle,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

Chart.register(...registerables);

export default function AuditHome() {
  const [audits, setAudits] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState(''); // 'url', 'domain', 'keyword'
  const [buttonLabel, setButtonLabel] = useState('Submit');
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [currentTab, setCurrentTab] = useState('Domain Overview'); // 'Domain Overview', 'Site Audit', 'Keyword Research'
  const [auditResults, setAuditResults] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [keywordData, setKeywordData] = useState(null);
  const [serpData, setSerpData] = useState(null);
  const chartInstances = useRef({});
  const chartRefs = useRef({});
  const healthScoreRef = useRef(null);
  const issueDistributionRef = useRef(null);
  const chromeUXMobileRef = useRef(null);
  const chromeUXDesktopRef = useRef(null);
  // Add these declarations along with your existing refs
  const trafficTrendChartRef = useRef(null);
  const organicVsPaidChartRef = useRef(null);
  const topKeywordsChartRef = useRef(null);
  const [sortedOrganicKeywords, setSortedOrganicKeywords] = useState([]);
  const [sortedPaidKeywords, setSortedPaidKeywords] = useState([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  useEffect(() => {
    // Fetch existing audits on component load
    fetchAuditHistory();
  }, []);

  const fetchAuditHistory = async () => {
    try {
      const response = await axios.post('/api/audit/list', { limit: 10 });
      setAudits(response.data.items);
    } catch (error) {
      console.error('Error fetching audit history:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Detect input type
    if (value.startsWith('http://') || value.startsWith('https://')) {
      setInputType('url');
      setButtonLabel('Show Domain Overview');
      setDropdownOptions(['Show Domain Overview + Start Audit']);
      setSelectedOption('Show Domain Overview');
    } else if (value.includes(' ')) {
      setInputType('keyword');
      setButtonLabel('Start Keyword Research');
      setDropdownOptions([]);
      setSelectedOption('');
    } else if (value) {
      setInputType('domain');
      setButtonLabel('Show Domain Overview');
      setDropdownOptions(['Show Domain Overview', 'Show Domain Overview + Start Audit', 'Show Keyword Overview']);
      setSelectedOption('Show Domain Overview');
    } else {
      setInputType('');
      setButtonLabel('Submit');
      setDropdownOptions([]);
      setSelectedOption('');
    }
  };

  // Scroll Advertising Table
  const scrollAdvertisingTable = (direction) => {
    const container = document.querySelector(`.${styles.advertisingTableWrapper}`);
    if (container) {
      const scrollAmount = 200; // Adjust scroll speed as needed
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleSubmit = async () => {
    if (inputType === 'keyword') {
      // Start Keyword Research
      setCurrentTab('Keyword Research');
      // Implement your keyword research functionality here
    } else {
      // Extract domain if input is URL
      let domain = inputValue;
      if (inputType === 'url') {
        try {
          domain = new URL(inputValue).hostname;
        } catch (error) {
          alert('Invalid URL format.');
          return;
        }
      }
      // Remove 'www.' from domain
      domain = domain.replace(/^www\./, '');

      if (selectedOption.includes('Start Audit')) {
        // Start Audit
        await handleStartAudit(domain);
        setCurrentTab('Site Audit');
      } else {
        setCurrentTab('Domain Overview');
      }

      // Fetch Domain Overview
      await fetchDomainOverview(domain);
    }
  };

  const handleStartAudit = async (domain) => {
    setLoadingAudit(true);
    setAuditResults(null);

    try {
      const response = await axios.post('/api/audit/create', { domain });
      const auditId = response.data.id;

      const newAudit = {
        id: auditId,
        title: `${domain}_${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`,
        status: 'pending',
      };
      setAudits([newAudit, ...audits]);

      // Start polling to check audit status
      startPollingForAudit(auditId);
    } catch (error) {
      console.error('Error starting audit:', error);
      setLoadingAudit(false);
    }
  };

  const startPollingForAudit = (auditId) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`/api/audit/${auditId}`);
        if (statusResponse.data.status === 'finished') {
          clearInterval(interval);
          fetchAuditReport(auditId);
        }
      } catch (error) {
        console.error('Error checking audit status:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const fetchAuditReport = async (auditId) => {
    try {
      const reportResponse = await axios.get(`/api/audit/${auditId}/report`);
      setAuditResults(reportResponse.data);
      setLoadingAudit(false);
      setAudits((prevAudits) =>
        prevAudits.map((audit) =>
          audit.id === auditId ? { ...audit, status: 'finished' } : audit
        )
      );
    } catch (error) {
      console.error('Error fetching audit report:', error);
    }
  };

  const fetchDomainOverview = async (domain) => {
    setLoadingOverview(true);
    setOverviewData(null);

    try {
      domain = domain.replace(/^www\./, '');

      const endpoints = [
        { name: 'overview', url: `/api/audit/overview/overview?domain=${encodeURIComponent(domain)}` },
        { name: 'history', url: `/api/audit/overview/history?domain=${encodeURIComponent(domain)}&type=organic` },
        { name: 'organicKeywords', url: `/api/audit/overview/organicKeywords?domain=${encodeURIComponent(domain)}` },
        { name: 'paidKeywords', url: `/api/audit/overview/paidKeywords?domain=${encodeURIComponent(domain)}` },
        { name: 'advertising', url: `/api/audit/overview/advertising?domain=${encodeURIComponent(domain)}` },
        { name: 'competitors', url: `/api/audit/overview/competitors?domain=${encodeURIComponent(domain)}&type=adv` },
      ];

      const data = {};

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint.url);
          data[endpoint.name] = response.data;
        } catch (error) {
          if (error.response?.status === 429) {
            alert('Rate limit exceeded. Please try again later.');
            break;
          } else if (error.response?.status === 404) {
            console.warn(`Data for ${endpoint.name} not found.`);
            data[endpoint.name] = {}; // Assign empty object or default as needed
          } else {
            console.error(`Error fetching ${endpoint.name}:`, error);
            data[endpoint.name] = {}; // Assign empty object to prevent undefined
          }
        }
        await wait(500); // Adjust the delay as needed
      }

      setOverviewData(data);
      setLoadingOverview(false);
    } catch (error) {
      console.error('Error fetching domain overview:', error);
      setLoadingOverview(false);
    }
  };

  // Utility function to wait for a specified time
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleAuditClick = (auditId) => {
    setCurrentTab('Site Audit');
    fetchAuditReport(auditId);
  };

  useEffect(() => {
    if (auditResults) {
      // Render charts for Site Audit
      renderHealthScoreChart();
      renderIssueDistributionChart();
      renderChromeUXCharts();

      auditResults.sections.forEach((section) => {
        const sectionProps = section.props;
        if (sectionProps) {
          const labels = Object.values(sectionProps).map((prop) => prop.name);
          const data = Object.values(sectionProps).map((prop) => prop.value);

          if (['content_v2', 'links_v2', 'other_v2'].includes(section.uid)) {
            // Tables are rendered in the JSX
          } else {
            renderSectionChart(section, labels, data);
          }
        }
      });
    }

    return () => {
      Object.values(chartInstances.current).forEach((chart) => {
        chart.destroy();
      });
    };
  }, [auditResults]);

  useEffect(() => {
    if (overviewData) {
      // Sort Organic Keywords by traffic_percent descending
      const sortedOrganic = [...organicData].sort((a, b) => b.traffic_percent - a.traffic_percent);
      setSortedOrganicKeywords(sortedOrganic);

      // Sort Paid Keywords by traffic_percent descending
      const sortedPaid = [...paidData].sort((a, b) => b.traffic_percent - a.traffic_percent);
      setSortedPaidKeywords(sortedPaid);

      // Render charts for Domain Overview
      renderOverviewCharts();

      // Automatically select default competitors if desired
      if (overviewData.competitors && overviewData.competitors.length > 0) {
        const defaultCompetitors = overviewData.competitors.slice(0, 4);
        setSelectedCompetitors(defaultCompetitors);
      }
    }
  }, [overviewData]);

  useEffect(() => {
    if (selectedCompetitors.length > 0) {
      renderKeywordShareChart();
      renderCompetitivePositioningChart();
    }
  }, [selectedCompetitors]);

  const renderKeywordShareChart = () => {
    const ctx = document.getElementById('keywordShareChart').getContext('2d');

    // Destroy existing chart if any
    if (chartInstances.current['keywordShareChart']) {
      chartInstances.current['keywordShareChart'].destroy();
    }

    const labels = selectedCompetitors.map((c) => c.domain);
    const data = selectedCompetitors.map((c) => c.common_keywords);

    chartInstances.current['keywordShareChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Common Keywords',
            data,
            backgroundColor: '#17a2b8',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  };

  const renderCompetitivePositioningChart = () => {
    // Ensure overviewData is available
    if (!overviewData || !overviewData.overview || !overviewData.competitors) {
      console.error('Overview data or competitors data is missing.');
      return;
    }

    const ctx = document.getElementById('competitivePositioningChart').getContext('2d');

    // Destroy existing chart if any
    if (chartInstances.current['competitivePositioningChart']) {
      chartInstances.current['competitivePositioningChart'].destroy();
    }

    const ownOrganicTrafficSum = overviewData.overview.organic.traffic_sum || 1; // Prevent division by zero

    // Calculate total organic traffic including competitors
    const totalOrganicTraffic =
      ownOrganicTrafficSum +
      selectedCompetitors.reduce((acc, c) => acc + (c.traffic_sum || 0), 0);

    // Determine the maximum competition value among competitors and your domain
    const maxCompetition = Math.max(
      ...selectedCompetitors.map((c) => c.common_keywords || 0),
      overviewData.overview.organic.keywords_count || 0
    );

    const fixedMaxRadius = 15; // Fixed radius for the highest competition

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

    // Assign colors to competitors
    const competitorColors = selectedCompetitors.map((_, idx) => colorPalette[idx % colorPalette.length]);

    // Create datasets for each competitor
    const competitorDatasets = selectedCompetitors.map((c, idx) => {
        const x = c.common_keywords || 0;
        const y = Number(((c.traffic_sum / totalOrganicTraffic) * 100).toFixed(2)) || 0;
        const r = 10; // Fixed radius for debugging
      
        console.log(`Competitor: ${c.domain}, x: ${x}, y: ${y}, r: ${r}`);
      
        return {
          label: c.domain,
          data: [{ x, y, r }],
          backgroundColor: competitorColors[idx],
          borderColor: competitorColors[idx].replace('0.7', '1'),
          borderWidth: 1,
          hoverBackgroundColor: competitorColors[idx].replace('0.7', '0.9'),
          hoverBorderColor: competitorColors[idx].replace('0.7', '1'),
        };
      });
      

    // Create dataset for your own domain
    const ownDataPoint = {
      x: overviewData.overview.organic.keywords_count || 0, // Number of organic keywords
      y: Number(((ownOrganicTrafficSum / totalOrganicTraffic) * 100).toFixed(2)) || 0, // Organic traffic share as percentage
      r: maxCompetition > 0
        ? (overviewData.overview.organic.keywords_count / maxCompetition) * fixedMaxRadius
        : fixedMaxRadius,
    };

    const ownDataset = {
      label: overviewData.overview.organic.base_domain || 'Your Domain',
      data: [ownDataPoint],
      backgroundColor: 'rgba(255, 99, 132, 0.9)', // Distinct color for your domain
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(255, 99, 132, 1)',
      hoverBorderColor: 'rgba(255, 99, 132, 1)',
    };
    //console.log("OwnDataSet:", ownDataset);

    // Combine all datasets
    const allDatasets = [...competitorDatasets, ownDataset];
    console.log("allDatasets:", allDatasets);


    chartInstances.current['competitivePositioningChart'] = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: allDatasets,
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
                return `${label}: (${x} Common Keywords, ${y}%)`;
              },
            },
          },
          legend: {
            display: true,
            position: 'right', // Position legend on the right
            labels: {
              boxWidth: 20,
              padding: 15,
              generateLabels: function (chart) {
                const datasets = chart.data.datasets;
                return datasets.map((dataset) => ({
                  text: dataset.label,
                  fillStyle: dataset.backgroundColor,
                  strokeStyle: dataset.borderColor,
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: dataset.label, // Use label as index
                }));
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Common Keywords',
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
  };

  const renderHealthScoreChart = () => {
    if (healthScoreRef.current && auditResults) {
      const ctx = healthScoreRef.current.getContext('2d');
      if (chartInstances.current['healthScoreChart']) {
        chartInstances.current['healthScoreChart'].destroy();
      }
      chartInstances.current['healthScoreChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [
            {
              data: [auditResults.score_percent, 100 - auditResults.score_percent],
              backgroundColor: ['#28a745', '#e9ecef'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          cutout: '80%',
          plugins: {
            tooltip: { enabled: false },
            legend: { display: false },
          },
        },
      });
    }
  };

  const renderIssueDistributionChart = () => {
    if (issueDistributionRef.current && auditResults) {
      const ctx = issueDistributionRef.current.getContext('2d');
      if (chartInstances.current['issueDistributionChart']) {
        chartInstances.current['issueDistributionChart'].destroy();
      }
      chartInstances.current['issueDistributionChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Errors', 'Warnings', 'Notices'],
          datasets: [
            {
              data: [
                auditResults.total_errors,
                auditResults.total_warnings,
                auditResults.total_notices,
              ],
              backgroundColor: ['#dc3545', '#ffc107', '#17a2b8'],
            },
          ],
        },
        options: {
          cutout: '50%',
          plugins: {
            tooltip: { enabled: true },
            legend: { position: 'right' },
          },
        },
      });
    }
  };

  const renderSectionChart = (section, labels, data) => {
    const chartRef = chartRefs.current[section.uid];
    if (chartRef) {
      if (chartInstances.current[section.uid]) {
        chartInstances.current[section.uid].destroy();
      }
      chartInstances.current[section.uid] = new Chart(chartRef, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: section.name,
              data,
              backgroundColor: generateColors(data.length),
            },
          ],
        },
        options: {
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { beginAtZero: true },
          },
        },
      });
    }
  };

  const renderChromeUXCharts = () => {
    // Render ChromeUX Mobile
    if (chromeUXMobileRef.current && auditResults.chromeux?.mobile) {
      const ctx = chromeUXMobileRef.current.getContext('2d');
      const mobileData = auditResults.chromeux.mobile;
      renderChromeUXChart(ctx, mobileData, 'ChromeUX Mobile');
    }

    // Render ChromeUX Desktop
    if (chromeUXDesktopRef.current && auditResults.chromeux?.desktop) {
      const ctx = chromeUXDesktopRef.current.getContext('2d');
      const desktopData = auditResults.chromeux.desktop;
      renderChromeUXChart(ctx, desktopData, 'ChromeUX Desktop');
    }
  };

  const renderChromeUXChart = (ctx, data, title) => {
    if (chartInstances.current[title]) {
      chartInstances.current[title].destroy();
    }
    const labels = ['LCP', 'CLS', 'INP'];
    const backgroundColors = ['#28a745', '#ffc107', '#dc3545'];
    const datasets = [];

    labels.forEach((label, index) => {
      const metric = data[label.toLowerCase()];
      if (metric && metric.histogram) {
        datasets.push({
          label: label,
          data: metric.histogram,
          backgroundColor: backgroundColors[index],
          stack: 'Stack 0',
        });
      } else {
        // If data is missing, push zeros
        datasets.push({
          label: label,
          data: [0, 0, 0],
          backgroundColor: backgroundColors[index],
          stack: 'Stack 0',
        });
      }
    });

    chartInstances.current[title] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Good', 'Needs Improvement', 'Poor'],
        datasets,
      },
      options: {
        plugins: {
          legend: { display: true },
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, max: 100 },
        },
      },
    });
  };

  const SortableTable = ({ columns, data }) => {
    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow,
    } = useTable(
      {
        columns,
        data,
      },
      useSortBy
    );

    return (
      <table {...getTableProps()} className={styles.sortableTable}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={column.isSorted ? (column.isSortedDesc ? styles.desc : styles.asc) : ''}
                >
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.length > 0 ? (
            rows.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className={styles.noData}>
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  // Define columns for Organic Keywords
  const organicColumns = useMemo(
    () => [
      {
        Header: 'Keyword',
        accessor: 'keyword',
      },
      {
        Header: 'Position',
        accessor: 'position',
        Cell: ({ row }) => {
          const currentPos = row.original.position;
          const prevPos = row.original.prev_pos;
          const change = prevPos ? prevPos - currentPos : 0;
          const indicator =
            change > 0 ? '🔼' : change < 0 ? '🔽' : '➖';
          return (
            <>
              {currentPos} {indicator} ({Math.abs(change)})
            </>
          );
        },
      },
      {
        Header: 'Traffic',
        accessor: 'traffic',
      },
      {
        Header: 'Traffic %',
        accessor: 'traffic_percent',
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
      },
      {
        Header: 'URL',
        accessor: 'url',
        Cell: ({ value }) => (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ),
      },
      {
        Header: 'Competition',
        accessor: 'competition',
      },
    ],
    []
  );

  const organicData = useMemo(() => {
    if (!overviewData?.organicKeywords) return [];
    return overviewData.organicKeywords.map((keyword) => ({
      keyword: keyword.keyword,
      position: keyword.position,
      prev_pos: keyword.prev_pos,
      traffic: keyword.traffic,
      traffic_percent: keyword.traffic_percent,
      difficulty: keyword.difficulty,
      url: keyword.url,
      competition: keyword.competition,
    }));
  }, [overviewData]);

  // Define columns for Paid Keywords
  const paidColumns = useMemo(
    () => [
      {
        Header: 'Keyword',
        accessor: 'keyword',
      },
      {
        Header: 'Position',
        accessor: 'position',
        Cell: ({ row }) => {
          const currentPos = row.original.position;
          const prevPos = row.original.prev_pos;
          const change = prevPos ? prevPos - currentPos : 0;
          const indicator =
            change > 0 ? '🔼' : change < 0 ? '🔽' : '➖';
          return (
            <>
              {currentPos} {indicator} ({Math.abs(change)})
            </>
          );
        },
      },
      {
        Header: 'Traffic',
        accessor: 'traffic',
      },
      {
        Header: 'Traffic %',
        accessor: 'traffic_percent',
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
      },
      {
        Header: 'URL',
        accessor: 'url',
        Cell: ({ value }) => (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ),
      },
      {
        Header: 'Competition',
        accessor: 'competition',
      },
    ],
    []
  );

  // Prepare data for Paid Keywords
  const paidData = useMemo(() => {
    if (!overviewData?.paidKeywords) return [];
    return overviewData.paidKeywords.map((keyword) => ({
      keyword: keyword.keyword,
      position: keyword.position,
      prev_pos: keyword.prev_pos,
      traffic: keyword.traffic,
      traffic_percent: keyword.traffic_percent,
      difficulty: keyword.difficulty,
      url: keyword.url,
      competition: keyword.competition,
      snippet_description: keyword.snippet_description,
      snippet_display_url: keyword.snippet_display_url,
      snippet_title: keyword.snippet_title,
      block: keyword.block,
      cpc: keyword.cpc,
    }));
  }, [overviewData]);

  // Function to render overview charts
  const renderOverviewCharts = () => {
    // Traffic Trend Chart
    if (trafficTrendChartRef.current && overviewData.history && overviewData.history.length > 0) {
      const ctx = trafficTrendChartRef.current.getContext('2d');
      if (chartInstances.current['trafficTrendChart']) {
        chartInstances.current['trafficTrendChart'].destroy();
      }

      const labels = overviewData.history.map(
        (item) => `${item.month}/${item.year}`
      );
      const data = overviewData.history.map((item) => item.traffic_sum || 0);

      chartInstances.current['trafficTrendChart'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Organic Traffic',
              data,
              fill: false,
              borderColor: '#007bff',
              tension: 0.1,
            },
          ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allows the chart to resize
            plugins: { /* existing plugins */ },
            scales: { /* existing scales */ },
          },
      });
    }

    // Organic vs Paid Keywords Chart
    if (organicVsPaidChartRef.current && overviewData.overview) {
      const ctx = organicVsPaidChartRef.current.getContext('2d');
      if (chartInstances.current['organicVsPaidChart']) {
        chartInstances.current['organicVsPaidChart'].destroy();
      }

      // Handle 'adv' as an array
      const organicKeywords = overviewData.overview.organic?.keywords_count || 0;
      const paidKeywords = Array.isArray(overviewData.overview.adv) ? overviewData.overview.adv.length : (overviewData.overview.adv?.keywords_count || 0);

      if (organicKeywords + paidKeywords > 0) {
        chartInstances.current['organicVsPaidChart'] = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Organic Keywords', 'Paid Keywords'],
            datasets: [
              {
                data: [organicKeywords, paidKeywords],
                backgroundColor: ['#28a745', '#dc3545'],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
            },
          },
        });
      }
    }

    // Top Keywords Chart
    if (topKeywordsChartRef.current && overviewData.organicKeywords && overviewData.organicKeywords.length > 0) {
      const ctx = topKeywordsChartRef.current.getContext('2d');
      if (chartInstances.current['topKeywordsChart']) {
        chartInstances.current['topKeywordsChart'].destroy();
      }

      const topKeywords = overviewData.organicKeywords.slice(0, 10);
      const labels = topKeywords.map((item) => item.keyword || 'N/A');
      const data = topKeywords.map((item) => item.position || 0);

      chartInstances.current['topKeywordsChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Keyword Positions',
              data,
              backgroundColor: '#17a2b8',
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { beginAtZero: true, reverse: true },
          },
        },
      });
    }
  };

  const generateColors = (num) => {
    const colors = [
      'rgba(75, 192, 192, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(201, 203, 207, 0.6)',
      'rgba(0, 204, 102, 0.6)',
      'rgba(102, 102, 255, 0.6)',
      'rgba(255, 102, 255, 0.6)',
    ];
    return colors.slice(0, num);
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h3>Audit History</h3>
        <ul>
          {audits.map((audit) => (
            <li
              key={audit.id}
              className={audit.status === 'finished' ? styles.finished : styles.pending}
              onClick={() => handleAuditClick(audit.id)}
            >
              {audit.title}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.main}>
        <h1>SEO Tool</h1>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter your domain or keyword"
            value={inputValue}
            onChange={handleInputChange}
          />
          <button onClick={handleSubmit} disabled={!inputValue}>
            {buttonLabel}
          </button>
          {dropdownOptions.length > 0 && (
            <select value={selectedOption} onChange={handleOptionChange}>
              {dropdownOptions.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>

        {loadingAudit && <div className={styles.loading}>Running Audit...</div>}
        {loadingOverview && <div className={styles.loading}>Fetching Domain Overview...</div>}

        {/* Tabs */}
        {inputType && (
          <div className={styles.tabs}>
            <button
              className={currentTab === 'Domain Overview' ? styles.activeTab : ''}
              onClick={() => setCurrentTab('Domain Overview')}
            >
              Domain Overview
            </button>
            <button
              className={currentTab === 'Site Audit' ? styles.activeTab : ''}
              onClick={() => setCurrentTab('Site Audit')}
            >
              Site Audit
            </button>
            <button
              className={currentTab === 'Keyword Research' ? styles.activeTab : ''}
              onClick={() => setCurrentTab('Keyword Research')}
            >
              Keyword Research
            </button>
          </div>
        )}

        {/* Domain Overview Tab */}
        {currentTab === 'Domain Overview' && overviewData && (
          <div className={styles.overview}>
            <h2>
              Domain Overview for {overviewData.overview?.organic?.base_domain || 'N/A'}
            </h2>

            {/* Unified Grid Container */}
            <div className={styles.domainOverviewGrid}>

              {/* Row 1: Overview Metrics */}
              <div className={styles.metricItem}>
                <h3>Keywords Count</h3>
                <p>Organic: {overviewData.overview?.organic?.keywords_count || 'N/A'}</p>
                <p>Paid: {overviewData.overview?.adv?.keywords_count || 'N/A'}</p>
              </div>
              <div className={styles.metricItem}>
                <h3>Organic Traffic</h3>
                <p>{overviewData.overview?.organic?.traffic_sum ?? 'N/A'}</p>
                <small>Organic Traffic Value: ${overviewData.overview?.organic?.price_sum?.toFixed(2) || 'N/A'}</small>
              </div>
              <div className={styles.metricItem}>
                <h3>Adv Traffic Sum</h3>
                <p>
                  {Array.isArray(overviewData.overview?.adv)
                    ? overviewData.overview.adv.reduce((acc, curr) => acc + (curr.traffic_sum || 0), 0)
                    : overviewData.overview?.adv?.traffic_sum ?? 'N/A'}
                </p>
              </div>
              <div className={styles.metricItem}>
                <h3>Organic Keywords Total</h3>
                <p>{overviewData.organicKeywords?.length || 0}</p>
                <h5>Paid Keywords Total</h5>
                <p>{overviewData.paidKeywords?.length || 0}</p>
              </div>

              {/* Row 2: Charts */}
              <div className={styles.chartItem} style={{ gridColumn: 'span 2' }}>
                {loadingOverview ? (
                  <p>Loading...</p>
                ) : overviewData.history && overviewData.history.length > 0 ? (
                  <canvas ref={trafficTrendChartRef}></canvas>
                ) : (
                  <p>No traffic trend data available.</p>
                )}
              </div>
              <div className={styles.chartItem}>
                <h3>Organic vs Paid Keywords</h3>
                {(overviewData.overview?.organic?.keywords_count > 0 ||
                  (Array.isArray(overviewData.overview?.adv) && overviewData.overview.adv.length > 0)) ? (
                  <canvas ref={organicVsPaidChartRef}></canvas>
                ) : (
                  <p>No data available for Organic vs Paid Keywords.</p>
                )}
              </div>
              <div className={styles.chartItem}>
                <h3>Top Organic Keywords</h3>
                {overviewData.organicKeywords && overviewData.organicKeywords.length > 0 ? (
                  <canvas ref={topKeywordsChartRef}></canvas>
                ) : (
                  <p>No organic keywords data available.</p>
                )}
              </div>

              {/* Row 3: Tables */}
              <div className={styles.tableContainer}>
                <h3>Organic Keywords</h3>
                <div className={styles.tableWrapper}>
                  <SortableTable columns={organicColumns} data={sortedOrganicKeywords} />
                </div>
              </div>
              <div className={styles.tableContainer}>
                <h3>Paid Keywords</h3>
                <div className={styles.tableWrapper}>
                  <SortableTable columns={paidColumns} data={sortedPaidKeywords} />
                </div>
              </div>

              {/* Row 4: Competitors */}
              <div className={styles.competitorsSection}>
                <h3>Competitors</h3>

                {/* Competitors Selection */}
                <div className={styles.competitorsSelect}>
                  <label htmlFor="competitors">Select Competitors:</label>
                  <select
                    id="competitors"
                    multiple
                    value={selectedCompetitors.map((c) => c.domain)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((option) =>
                        overviewData.competitors.find((c) => c.domain === option.value)
                      ).filter(Boolean);
                      setSelectedCompetitors(selected);
                    }}
                  >
                    {overviewData.competitors.map((competitor, idx) => (
                      <option key={idx} value={competitor.domain}>
                        {competitor.domain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Competitor Charts */}
                <div className={styles.competitorCharts}>
                  <div className={styles.chartItem}>
                    <h4>Keyword Share Among Competitors</h4>
                    <canvas id="keywordShareChart"></canvas>
                  </div>

                  <div className={styles.chartItem}>
                    <h4>Competitive Positioning</h4>
                    <canvas id="competitivePositioningChart"></canvas>
                  </div>
                </div>
              </div>

              {/* Row 5: Paid Keywords Carousel */}
              <div className={styles.paidKeywordsCarousel}>
                {sortedPaidKeywords && sortedPaidKeywords.length > 0 && (
                  <>
                    <h3>Paid Keywords</h3>

                    <Slider {...carouselSettings}>
                      {sortedPaidKeywords.map((keyword, index) => (
                        <div key={index} className={styles.carouselItem}>
                          <div className={styles.carouselPosition}>
                            <p>Keyword: {keyword.keyword}</p>
                          </div>
                          <div className={styles.carouselContent}>
                            <p>#{keyword.position}</p>

                            <a href={keyword.url} target="_blank" rel="noopener noreferrer" className={styles.carouselUrl}>
                              {keyword.snippet_title}
                            </a>
                            <p className={styles.carouselDescription}>{keyword.snippet_description}</p>
                            <a href={keyword.snippet_display_url} target="_blank" rel="noopener noreferrer" className={styles.carouselDisplayUrl}>
                              {keyword.snippet_display_url}
                            </a>
                            <div className={styles.carouselMetrics}>
                              <span>Block: {keyword.block}</span>
                              <span>Traffic: {keyword.traffic} ({keyword.traffic_percent}%)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </Slider>
                  </>
                )}
              </div>

              {/* Row 6: Advertising Snippets */}
              {overviewData.advertising && overviewData.advertising.length > 0 && (
                <div className={styles.advertisingSnippets}>
                  <h3>Advertising Snippets</h3>
                  <div className={styles.advertisingTableWrapper}>
                    <table className={styles.pivotTable}>
                      <thead>
                        <tr>
                          <th>Keyword</th>
                          {Object.keys(overviewData.advertising[0].snippets).map((date) => (
                            <th key={date}>{date}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {overviewData.advertising.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.keyword}</td>
                            {Object.entries(item.snippets).map(([date, snippet]) => (
                              <td key={date}>
                                <strong>{snippet.position}</strong>
                                <br />
                                <a href={snippet.url} target="_blank" rel="noopener noreferrer" className={styles.snippetUrl}>
                                  {snippet.snippet_title}
                                </a>
                                <br />
                                <p className={styles.snippetDescription}>{snippet.snippet_description}</p>
                                <a href={snippet.snippet_display_url} target="_blank" rel="noopener noreferrer" className={styles.snippetDisplayUrl}>
                                  {snippet.snippet_display_url}
                                </a>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Scroll Arrows */}
                    <button className={`${styles.scrollArrow} ${styles.left}`} onClick={() => scrollAdvertisingTable('left')}>◀</button>
                    <button className={`${styles.scrollArrow} ${styles.right}`} onClick={() => scrollAdvertisingTable('right')}>▶</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Site Audit Tab */}
        {currentTab === 'Site Audit' && auditResults && (
          <>
            <h2>{auditResults.domain_props.domain}</h2>
            <p>Audit Time: {auditResults.audit_time}</p>

            {/* Domain Properties Grid */}
            <div className={styles.domainPropsGrid}>
              <div className={styles.domainPropItem}>
                <h4>Backlinks</h4>
                <p>{auditResults.domain_props.backlinks}</p>
              </div>
              <div className={styles.domainPropItem}>
                <h4>Indexed in Bing</h4>
                <p>{auditResults.domain_props.index_bing}</p>
              </div>
              <div className={styles.domainPropItem}>
                <h4>Indexed in Google</h4>
                <p>{auditResults.domain_props.index_google}</p>
              </div>
              <div className={styles.domainPropItem}>
                <h4>Total Pages Checked</h4>
                <p>{auditResults.total_pages}</p>
              </div>
            </div>

            <div className={styles.results}>
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <h3>Health Score</h3>
                  <canvas ref={healthScoreRef} className={styles.chart}></canvas>
                </div>
                <div className={styles.summaryItem}>
                  <h3>Issue Distribution</h3>
                  <canvas ref={issueDistributionRef} className={styles.chart}></canvas>
                </div>
              </div>

              <div className={styles.gridContainer}>
                {auditResults.sections.map((section) => (
                  <div
                    key={section.uid}
                    className={styles.gridItem}
                    style={{
                      gridColumn: ['metatags_v2', 'content_v2', 'mobile'].includes(section.uid)
                        ? 'span 2'
                        : 'span 1',
                      gridRow: section.uid === 'content_v2' ? 'span 2' : 'span 1',
                    }}
                  >
                    <h3>{section.name}</h3>
                    {['content_v2', 'links_v2', 'other_v2'].includes(section.uid) ? (
                      <table className={styles.issueTable}>
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Issue</th>
                            <th>Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.values(section.props)
                            .sort((a, b) => b.value - a.value)
                            .map((prop) => (
                              <tr key={prop.code}>
                                <td>
                                  <FontAwesomeIcon
                                    icon={
                                      prop.status === 'error'
                                        ? faTimesCircle
                                        : prop.status === 'warning'
                                        ? faExclamationTriangle
                                        : faInfoCircle
                                    }
                                    className={
                                      prop.status === 'error'
                                        ? styles.errorIcon
                                        : prop.status === 'warning'
                                        ? styles.warningIcon
                                        : styles.noticeIcon
                                    }
                                  />
                                </td>
                                <td>{prop.name}</td>
                                <td>{prop.value}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <canvas
                        ref={(el) => {
                          if (el) chartRefs.current[section.uid] = el.getContext('2d');
                        }}
                        className={styles.chart}
                      ></canvas>
                    )}
                  </div>
                ))}

                {/* ChromeUX Charts */}
                <div className={styles.gridItem} style={{ gridColumn: 'span 2' }}>
                  <h3>ChromeUX Mobile</h3>
                  <canvas ref={chromeUXMobileRef} className={styles.chart}></canvas>
                </div>
                <div className={styles.gridItem} style={{ gridColumn: 'span 2' }}>
                  <h3>ChromeUX Desktop</h3>
                  <canvas ref={chromeUXDesktopRef} className={styles.chart}></canvas>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Keyword Research Tab */}
        {currentTab === 'Keyword Research' && keywordData && (
          <div className={styles.keywordResearch}>
            {/* Display keyword research data */}
            {/* Implement your rendering logic here */}
          </div>
        )}
      </div>
    </div>
  );
}
