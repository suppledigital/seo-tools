// components/audit/domain-overview/DomainOverview.js

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './DomainOverview.module.css';
import {
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaLink,
  FaStar,
  FaStarHalfAlt,
} from 'react-icons/fa';
import { MdFeaturedPlayList } from 'react-icons/md';
import { Chart } from 'chart.js';
import Select from 'react-select';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import vennModule from 'highcharts/modules/venn';

// Initialize the module
vennModule(Highcharts);

// Dynamically import DataTable
const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

const DomainOverview = ({
  overviewData,
  loadingOverview,
  sortedOrganicKeywords,
  sortedPaidKeywords,
  allCompetitors,
  setCurrentTab,
}) => {
  // Refs for Chart.js canvases
  const chartInstances = useRef({});
  const trendChartRef = useRef(null);
  const intentChartRef = useRef(null);
  const rankingDistributionRef = useRef(null);
  const competitivePositioningChartRef = useRef(null);

  // State for tabs and data
  const [trafficType, setTrafficType] = useState('organic'); // 'organic' or 'paid' (used in Country Distribution)
  const [rankingTrafficType, setRankingTrafficType] = useState('organic'); // 'organic' or 'paid' (used in Ranking Distribution)
  const [selectedMetric, setSelectedMetric] = useState('traffic_sum');
  const [dateRange, setDateRange] = useState('12');
  const [keywordTab, setKeywordTab] = useState('all'); // 'all', 'improved', 'decreased', 'new', 'lost'

  // Prepare data for the trend chart
  const trendData = overviewData.history || [];

  // Prepare data for country distribution
  const countryData = overviewData.overview?.[trafficType]?.countries || [];

  // Prepare data for organic competitors
  const organicCompetitors = overviewData.competitors || [];

  // Data for Organic Keywords
  const [filteredOrganicKeywords, setFilteredOrganicKeywords] = useState([]);
  // Calculate Improved, Decreased, New, Lost keywords
  useEffect(() => {
    let filteredKeywords = [...sortedOrganicKeywords];

    switch (keywordTab) {
      case 'improved':
        filteredKeywords = filteredKeywords.filter(
          (kw) => kw.prev_pos && kw.position < kw.prev_pos
        );
        break;
      case 'decreased':
        filteredKeywords = filteredKeywords.filter(
          (kw) => kw.prev_pos && kw.position > kw.prev_pos
        );
        break;
      case 'new':
        filteredKeywords = filteredKeywords.filter(
          (kw) => (!kw.prev_pos || kw.prev_pos === 0) && kw.position > 0
        );
        break;
      case 'lost':
        filteredKeywords = filteredKeywords.filter(
          (kw) => kw.prev_pos > 0 && kw.position === 0
        );
        break;
      default:
        break;
    }

    setFilteredOrganicKeywords(filteredKeywords);
  }, [keywordTab, sortedOrganicKeywords]);

  // Define columns for Organic Keywords with function selectors
  const organicColumns = [
    {
      name: 'Keyword',
      selector: (row) => row.keyword,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Search Vol.',
      selector: (row) => row.volume,
      sortable: true,
    },
    {
      name: 'Position',
      selector: (row) => row.position,
      sortable: true,
      cell: (row) => {
        const positionChange = row.prev_pos
          ? row.prev_pos - row.position
          : null;
        const isNew = (!row.prev_pos || row.prev_pos === 0) && row.position > 0;
        const isLost = row.prev_pos > 0 && row.position === 0;

        let changeIcon = <FaMinus color="gray" />;
        if (positionChange > 0) {
          changeIcon = <FaArrowUp color="green" />;
        } else if (positionChange < 0) {
          changeIcon = <FaArrowDown color="red" />;
        } else if (isNew) {
          changeIcon = <FaArrowUp color="blue" />;
        } else if (isLost) {
          changeIcon = <FaArrowDown color="black" />;
        }

        // Icon for block_type
        let blockIcon = null;
        if (row.block_type) {
          blockIcon = getBlockTypeIcon(row.block_type);
        }

        return (
          <div className={styles.positionCell}>
            {blockIcon}
            {row.position > 0 ? row.position : '-'}
            {positionChange !== null && (
              <span className={styles.changeIcon}>{changeIcon}</span>
            )}
          </div>
        );
      },
    },
    {
      name: 'Competition',
      selector: (row) => row.competition,
      sortable: true,
    },
    {
      name: 'CPC',
      selector: (row) => row.cpc,
      sortable: true,
      format: (row) => `$${row.cpc}`,
    },
  ];

  // Define columns for Organic Competitors with function selectors
  const competitorsColumns = [
    {
      name: 'Domain',
      selector: (row) => row.domain,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Overlap',
      selector: (row) => row.common_keywords,
      sortable: true,
    },
    {
      name: 'DT',
      selector: (row) => row.dt,
      sortable: true,
    },
    {
      name: 'Keywords Total',
      selector: (row) => row.total_keywords,
      sortable: true,
    },
  ];

  // Tabs for metrics and date ranges
  const metricOptions = [
    { label: 'Total Traffic', value: 'traffic_sum' },
    { label: 'Keywords', value: 'keywords_count' },
    { label: 'Traffic Cost', value: 'price_sum' },
  ];
  const dateRangeOptions = ['6', '12', '18', '24', '30', '36', 'All'];

  // Function to map block_type to icons
  const getBlockTypeIcon = (blockType) => {
    switch (blockType) {
      case 'sitelinks':
        return <FaLink title="Sitelinks" className={styles.blockIcon} />;
      case 'reviews':
        return <FaStar title="Reviews" className={styles.blockIcon} />;
      case 'featured_snippets':
        return (
          <MdFeaturedPlayList
            title="Featured Snippets"
            className={styles.blockIcon}
          />
        );
      // Add more cases as needed
      default:
        return null;
    }
  };

 // Chart Rendering Functions
 const renderTrendChart = () => {
  if (trendChartRef.current && trendData.length > 0) {
    const ctx = trendChartRef.current.getContext('2d');
    if (chartInstances.current['trendChart']) {
      chartInstances.current['trendChart'].destroy();
    }

    // Determine months to show based on dateRange
    const monthsToShow = dateRange === 'All' ? Infinity : parseInt(dateRange);
    const limitedData =
      monthsToShow !== Infinity ? trendData.slice(-monthsToShow) : trendData;

    const labels = limitedData.map((item) => `${item.month}/${item.year}`);
    const data = limitedData.map((item) => item[selectedMetric] || 0);

    chartInstances.current['trendChart'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label:
              selectedMetric === 'traffic_sum'
                ? 'Total Traffic'
                : selectedMetric === 'keywords_count'
                ? 'Keywords'
                : 'Traffic Cost',
            data,
            fill: false,
            borderColor: '#007bff',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false,
              drawOnChartArea: false,
            },
            ticks: {
              display: true,
            },
          },
          y: {
            grid: {
              display: true,
              drawBorder: false,
            },
            ticks: {
              display: true,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
};

useEffect(() => {
  renderTrendChart();

  return () => {
    Object.values(chartInstances.current).forEach((chart) => {
      if (chart) chart.destroy();
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [overviewData, selectedMetric, dateRange]);

// Keyword by Intent
const [intentData, setIntentData] = useState([]);
useEffect(() => {
  fetchIntentData();
}, []);

const fetchIntentData = async () => {
  // Make an API call to fetch intent data
  // For now, use dummy data
  const dummyIntentData = [
    { intent: 'Informational', keywords: 1200 },
    { intent: 'Navigational', keywords: 800 },
    { intent: 'Transactional', keywords: 600 },
    { intent: 'Commercial', keywords: 400 },
  ];
  setIntentData(dummyIntentData);
};

const renderIntentChart = () => {
  if (intentChartRef.current && intentData.length > 0) {
    const ctx = intentChartRef.current.getContext('2d');
    if (chartInstances.current['intentChart']) {
      chartInstances.current['intentChart'].destroy();
    }

    const labels = intentData.map((item) => item.intent);
    const data = intentData.map((item) => item.keywords);

    chartInstances.current['intentChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: '#007bff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
          },
        },
      },
    });
  }
};

useEffect(() => {
  renderIntentChart();
}, [intentData]);

// Similarly, update SERP Features section
const getSERPFeatureIcon = (feature) => {
  switch (feature) {
    case 'sitelinks':
      return <FaLink title="Sitelinks" className={styles.serpFeatureIcon} />;
    case 'reviews':
      return <FaStar title="Reviews" className={styles.serpFeatureIcon} />;
    case 'featured_snippets':
      return (
        <MdFeaturedPlayList
          title="Featured Snippets"
          className={styles.serpFeatureIcon}
        />
      );
    // Add more cases as needed
    default:
      return null;
  }
};

// SERP Features
const [serpFeatures, setSerpFeatures] = useState([]);

useEffect(() => {
  calculateSerpFeatures();
}, [sortedOrganicKeywords]);

const calculateSerpFeatures = () => {
  const featureCounts = {};

  sortedOrganicKeywords.forEach((kw) => {
    if (kw.block_type) {
      const blockType = kw.block_type;
      featureCounts[blockType] = (featureCounts[blockType] || 0) + 1;
    }
  });

  const featuresArray = Object.keys(featureCounts).map((feature) => ({
    feature,
    count: featureCounts[feature],
  }));

  setSerpFeatures(featuresArray);
};

// Distribution of Keyword Rankings
const renderRankingDistributionChart = () => {
  if (
    rankingDistributionRef.current &&
    overviewData.overview &&
    overviewData.overview[rankingTrafficType]
  ) {
    const ctx = rankingDistributionRef.current.getContext('2d');
    if (chartInstances.current['rankingDistributionChart']) {
      chartInstances.current['rankingDistributionChart'].destroy();
    }

    const data = overviewData.overview[rankingTrafficType];

    let ranges;
    let totalKeywords;
    if (rankingTrafficType === 'organic') {
      ranges = [
        { range: '1-5', count: data.top1_5 || 0 },
        { range: '6-10', count: data.top6_10 || 0 },
        { range: '11-20', count: data.top11_20 || 0 },
        { range: '21-50', count: data.top21_50 || 0 },
        { range: '51-100', count: data.top51_100 || 0 },
      ];
      totalKeywords = data.keywords_count || 1;
    } else if (rankingTrafficType === 'adv') {
      ranges = [
        { range: '1-2', count: data.top1_2 || 0 },
        { range: '3-5', count: data.top3_5 || 0 },
        { range: '6-8', count: data.top6_8 || 0 },
        { range: '9-11', count: data.top9_11 || 0 },
      ];
      totalKeywords = data.keywords_count || 1;
    }

    const percentages = ranges.map((r) =>
      ((r.count / totalKeywords) * 100).toFixed(2)
    );

    chartInstances.current['rankingDistributionChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ranges.map((r) => r.range),
        datasets: [
          {
            data: percentages,
            backgroundColor: '#007bff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.raw}%`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Position Ranges',
            },
          },
          y: {
            title: {
              display: true,
              text: '% of Keywords',
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
};

useEffect(() => {
  renderRankingDistributionChart();
}, [rankingTrafficType, overviewData]);

  // Organic Competitor Semantics Comparison (Venn Diagram)
  const [selectedVennCompetitors, setSelectedVennCompetitors] = useState([]);
  const [vennOptions, setVennOptions] = useState(null);

  useEffect(() => {
    const ownDomain = overviewData.overview?.organic?.base_domain || 'N/A';
    // Default to own domain and top 2 competitors
    const defaultCompetitors = [
      ownDomain,
      ...allCompetitors.slice(0, 2).map((comp) => comp.domain),
    ].slice(0, 3); // Limit to max 3 domains
    setSelectedVennCompetitors(defaultCompetitors);
  }, [overviewData, allCompetitors]);

  // Prepare options for react-select
  const vennCompetitorOptions = [
    { value: overviewData.overview?.organic?.base_domain || 'N/A', label: overviewData.overview?.organic?.base_domain || 'N/A' },
    ...allCompetitors.map((comp) => ({ value: comp.domain, label: comp.domain })),
  ];

  const handleVennCompetitorChange = (selectedOptions) => {
    if (selectedOptions.length > 3) {
      selectedOptions = selectedOptions.slice(0, 3);
    }
    setSelectedVennCompetitors(selectedOptions.map((option) => option.value));
  };

  const buildVennDiagramOptions = () => {
    if (selectedVennCompetitors.length >= 2 && overviewData && overviewData.overview && overviewData.overview.organic) {
      const ownDomain = overviewData.overview.organic.base_domain || 'N/A';
      const ownTotalKeywords = overviewData.overview.organic.keywords_count || 0;

      // Prepare domain data
      const domainData = {};
      domainData[ownDomain] = {
        domain: ownDomain,
        total_keywords: ownTotalKeywords,
        common_keywords: {},
      };

      allCompetitors.forEach((comp) => {
        domainData[comp.domain] = {
          domain: comp.domain,
          total_keywords: comp.total_keywords || 0,
          common_keywords: {
            [ownDomain]: comp.common_keywords || 0,
          },
        };
      });

      const selectedDomains = selectedVennCompetitors;
      const data = [];

      // Add sets for each domain
      selectedDomains.forEach((domain) => {
        const dataItem = domainData[domain];
        data.push({
          sets: [domain],
          value: dataItem.total_keywords,
          name: domain,
        });
      });

      // Add overlaps
      for (let i = 0; i < selectedDomains.length; i++) {
        for (let j = i + 1; j < selectedDomains.length; j++) {
          const domainA = selectedDomains[i];
          const domainB = selectedDomains[j];

          let overlapSize = 0;

          if (domainA === ownDomain || domainB === ownDomain) {
            // Overlap between own domain and competitor
            const competitorDomain = domainA === ownDomain ? domainB : domainA;
            const competitorData = domainData[competitorDomain];
            overlapSize = competitorData.common_keywords[ownDomain] || 0;
          } else {
            // Overlap between competitors - no data, assume minimal overlap
            const competitorDataA = domainData[domainA];
            const competitorDataB = domainData[domainB];
            overlapSize = Math.min(competitorDataA.total_keywords, competitorDataB.total_keywords) * 0.1; // Assume 10% overlap
          }

          data.push({
            sets: [domainA, domainB],
            value: overlapSize,
          });
        }
      }

      // Add triple overlap if 3 domains selected
      if (selectedDomains.length === 3) {
        const [domainA, domainB, domainC] = selectedDomains;

        // Assume minimal triple overlap
        const competitorDataA = domainData[domainA];
        const competitorDataB = domainData[domainB];
        const competitorDataC = domainData[domainC];

        const minTotalKeywords = Math.min(
          competitorDataA.total_keywords,
          competitorDataB.total_keywords,
          competitorDataC.total_keywords
        );

        const tripleOverlapSize = minTotalKeywords * 0.05; // Assume 5% overlap

        data.push({
          sets: [domainA, domainB, domainC],
          value: tripleOverlapSize,
        });
      }

      const options = {
        series: [{
          type: 'venn',
          data: data,
          name: 'Domain Overlaps',
          dataLabels: {
            style: {
              fontSize: '15px',
              textOutline: 'none'
            }
          }
        }],
        title: {
          text: 'Organic Competitor Semantics Comparison'
        },
        tooltip: {
          headerFormat: '',
          pointFormat: '<b>{point.name}</b><br>Overlap: {point.value}'
        },
      };

      setVennOptions(options);
    }
  };

  useEffect(() => {
    buildVennDiagramOptions();
  }, [selectedVennCompetitors, overviewData]);

   // Competitive Positioning Chart
   const [selectedCompetitorDomains, setSelectedCompetitorDomains] = useState([]);

   useEffect(() => {
     const defaultCompetitors = [
       overviewData.overview?.organic?.base_domain || 'N/A',
       ...allCompetitors.map(c => c.domain),
     ].slice(0, 5); // Limit default to 5 domains
     setSelectedCompetitorDomains(defaultCompetitors);
   }, [overviewData, allCompetitors]);

   // Prepare options for react-select
   const competitorOptions = [
     { value: overviewData.overview?.organic?.base_domain || 'N/A', label: overviewData.overview?.organic?.base_domain || 'N/A' },
     ...allCompetitors.map(c => ({ value: c.domain, label: c.domain })),
   ];

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

       // Filter competitors based on selectedCompetitorDomains
       const selectedCompData = allCompetitors.filter((c) =>
         selectedCompetitorDomains.includes(c.domain)
       );

       // Calculate total organic traffic including selected competitors
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

       // Include own domain if selected
       if (selectedCompetitorDomains.includes(userDomain)) {
         const ownTrafficPercentage =
           Number(((ownOrganicTrafficSum / totalOrganicTraffic) * 100).toFixed(2)) || 0;

         const ownDataPoint = {
           label: userDomain,
           x: userTotalKeywords,
           y: ownTrafficPercentage,
           trafficPercentage: ownTrafficPercentage,
         };

         allDataPoints.push(ownDataPoint);
       }

       // Create data points for each selected competitor
       selectedCompData.forEach((c) => {
         const x = c.total_keywords || 0;
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
           maintainAspectRatio: false,

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

   useEffect(() => {
     renderCompetitivePositioningChart();
   }, [selectedCompetitorDomains, overviewData]);

  

  return (
    <div className={styles.overview}>
      <h2>
        Domain Overview for{' '}
        {overviewData.overview?.organic?.base_domain || 'N/A'}
      </h2>

      {/* First Row: Metrics */}
      <div className={styles.metricsRow}>
        {/* Column 1: Domain Trust and Page Trust */}
        <div className={`${styles.metricBox} ${styles.metricBox1}`}>
          <div className={styles.metricHeader}>
            <h3>
              Domain Trust{' '}
              <FaInfoCircle
                className={styles.infoIcon}
                title="Domain Trust is a metric..."
              />
            </h3>
          </div>
          <div className={styles.metricValue}>0</div>
          <hr className={styles.hr} />
          <div className={styles.metricHeader}>
            <h3>
              Page Trust{' '}
              <FaInfoCircle
                className={styles.infoIcon}
                title="Page Trust is a metric..."
              />
            </h3>
          </div>
          <div className={styles.metricValue}>0</div>
        </div>

        {/* Column 2: Organic Traffic */}
        <div className={`${styles.metricBox} ${styles.metricBox2}`}>
          <div className={styles.metricHeader}>
            <h3>
              Organic Traffic{' '}
              <FaInfoCircle
                className={styles.infoIcon}
                title="Organic Traffic is..."
              />
            </h3>
            <div className={styles.metricChange}>
              {/* Calculate change from previous month */}
              {overviewData.history && overviewData.history.length >= 2 ? (
                (() => {
                  const latest =
                    overviewData.history[overviewData.history.length - 1];
                  const previous =
                    overviewData.history[overviewData.history.length - 2];
                  const change = latest.traffic_sum - previous.traffic_sum;
                  const isIncrease = change >= 0;
                  return (
                    <span
                      className={isIncrease ? styles.increase : styles.decrease}
                    >
                      {isIncrease ? '▲' : '▼'} {Math.abs(change)}
                    </span>
                  );
                })()
              ) : (
                <span>N/A</span>
              )}
            </div>
          </div>
          <div className={styles.metricValue}>
            {overviewData.overview?.organic?.traffic_sum ?? 'N/A'}
          </div>
          <div className={styles.metricSubValue}>Clicks/mo</div>
          <hr className={styles.hr} />
          <div className={styles.metricSplit}>
            <div className={styles.metricSplitItem}>
              <h4>
                Keywords{' '}
                <FaInfoCircle
                  className={styles.infoIcon}
                  title="Number of Keywords..."
                />
              </h4>
              <div className={styles.metricValue}>
                {overviewData.overview?.organic?.keywords_count ?? 'N/A'}
              </div>
            </div>
            <div className={styles.metricSplitItem}>
              <h4>
                Total Traffic Cost{' '}
                <FaInfoCircle
                  className={styles.infoIcon}
                  title="Total Traffic Cost is..."
                />
              </h4>
              <div className={styles.metricValue}>
                {overviewData.overview?.organic?.price_sum ?? 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Paid Traffic */}
        <div className={`${styles.metricBox} ${styles.metricBox3}`}>
          <div className={styles.metricHeader}>
            <h3>
              Paid Traffic{' '}
              <FaInfoCircle
                className={styles.infoIcon}
                title="Paid Traffic is..."
              />
            </h3>
            <div className={styles.metricChange}>
              {/* Placeholder for change */}
              <span>N/A</span>
            </div>
          </div>
          <div className={styles.metricValue}>
            {overviewData.overview?.adv?.traffic_sum ?? 'N/A'}
          </div>
          <div className={styles.metricSubValue}>Clicks/mo</div>
          <hr className={styles.hr} />
          <div className={styles.metricSplit}>
            <div className={styles.metricSplitItem}>
              <h4>
                Keywords{' '}
                <FaInfoCircle
                  className={styles.infoIcon}
                  title="Number of Paid Keywords..."
                />
              </h4>
              <div className={styles.metricValue}>
                {overviewData.overview?.adv?.keywords_count ?? 'N/A'}
              </div>
            </div>
            <div className={styles.metricSplitItem}>
              <h4>
                Total Traffic Cost{' '}
                <FaInfoCircle
                  className={styles.infoIcon}
                  title="Total Paid Traffic Cost is..."
                />
              </h4>
              <div className={styles.metricValue}>
                {overviewData.overview?.adv?.price_sum ?? 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Referring Domains and Backlinks */}
        <div className={`${styles.metricBox} ${styles.metricBox4}`}>
          <div className={styles.metricHeader}>
            <h3>
              Referring Domains{' '}
              <FaInfoCircle
                className={styles.infoIcon}
                title="Referring Domains are..."
              />
            </h3>
          </div>
          <div className={styles.metricValue}>0</div>
          <hr className={styles.hr} />
          <div className={styles.metricHeader}>
            <h3>
              Backlinks{' '}
              <FaInfoCircle
                className={styles.infoIcon}
                title="Backlinks are..."
              />
            </h3>
          </div>
          <div className={styles.metricValue}>0</div>
        </div>
      </div>

      {/* Second Row */}
      <div className={styles.secondRow}>
        {/* Column 1: Traffic Distribution by Country */}
        <div className={styles.countryDistribution}>
          <div className={styles.tabHeader}>
            <button
              className={trafficType === 'organic' ? styles.activeTab : ''}
              onClick={() => setTrafficType('organic')}
            >
              Organic
            </button>
            <button
              className={trafficType === 'paid' ? styles.activeTab : ''}
              onClick={() => setTrafficType('paid')}
            >
              Paid
            </button>
          </div>
          <h3>Traffic Distribution by Country</h3>
          <table className={styles.countryTable}>
            <thead>
              <tr>
                <th>Country</th>
                <th>Traffic Share %</th>
                <th>Traffic</th>
                <th>Keywords Total</th>
              </tr>
            </thead>
            <tbody>
              {countryData.map((country, idx) => (
                <tr key={idx}>
                  <td>{country.country}</td>
                  <td>{country.traffic_percent}%</td>
                  <td>{country.traffic}</td>
                  <td>{country.keywords_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Column 2: Trend Chart */}
        <div className={styles.trendChartContainer}>
          <div className={styles.tabHeader}>
            {metricOptions.map((metric, idx) => (
              <button
                key={idx}
                className={
                  selectedMetric === metric.value ? styles.activeTab : ''
                }
                onClick={() => setSelectedMetric(metric.value)}
              >
                {metric.label}
              </button>
            ))}
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
          <div className={styles.chartContainer}>
            <canvas ref={trendChartRef}></canvas>
          </div>
        </div>
      </div>

        {/* Third Row */}
      <div className={styles.thirdRow}>
        {/* Organic Keywords */}
        <div className={styles.organicKeywords}>
          <div className={styles.tabHeader}>
            {['all', 'improved', 'decreased', 'new', 'lost'].map((tab) => (
              <button
                key={tab}
                className={keywordTab === tab ? styles.activeTab : ''}
                onClick={() => setKeywordTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <h3>Organic Keywords</h3>
          <DataTable
            columns={organicColumns}
            data={filteredOrganicKeywords}
            pagination
            paginationPerPage={5}
            highlightOnHover
            striped
          />
        </div>

        {/* Organic Competitors */}
        <div className={styles.organicCompetitors}>
          <h3>Organic Competitors</h3>
          <DataTable
            columns={competitorsColumns}
            data={organicCompetitors}
            pagination
            paginationPerPage={5}
            highlightOnHover
            striped
          />
        </div>
      </div>

      {/* Keyword by Intent Section */}
      <div className={styles.intentSection}>
        <h3>Keyword by Intent</h3>
        <div className={styles.intentChartContainer}>
          <canvas ref={intentChartRef}></canvas>
        </div>
        <table className={styles.intentTable}>
          <thead>
            <tr>
              <th>Intent</th>
              <th>Keywords</th>
              <th>Percent</th>
              <th>Traffic</th>
            </tr>
          </thead>
          <tbody>
            {/* Populate with data when available */}
          </tbody>
        </table>
      </div>

      {/* SERP Features Section */}
      <div className={styles.serpFeaturesSection}>
        <h3>SERP Features</h3>
        <div className={styles.serpFeaturesGrid}>
        {serpFeatures.map((item, idx) => (
          <div key={idx} className={styles.serpFeatureItem}>
            {getSERPFeatureIcon(item.feature)}
            <div className={styles.serpFeatureText}>
              {item.feature.replace('_', ' ')}
            </div>
            <div className={styles.serpFeatureCount}>
              Keywords: {item.count}
            </div>
          </div>
          ))}
        </div>
      </div>

      {/* Distribution Row */}
      <div className={styles.distributionRow}>
        {/* Distribution of Keyword Rankings */}
        <div className={styles.distributionSection}>
          <div className={styles.tabHeader}>
            <button
              className={
                rankingTrafficType === 'organic' ? styles.activeTab : ''
              }
              onClick={() => setRankingTrafficType('organic')}
            >
              Organic
            </button>
            <button
              className={
                rankingTrafficType === 'adv' ? styles.activeTab : ''
              }
              onClick={() => setRankingTrafficType('adv')}
            >
              Paid
            </button>
          </div>
          <h3>Distribution of Keyword Rankings</h3>
          <div className={styles.distributionChartContainer}>
            <canvas ref={rankingDistributionRef}></canvas>
          </div>
        </div>

        {/* Organic Competitor Semantics Comparison */}
        <div className={styles.vennSection}>
          <h3>Organic Competitor Semantics Comparison</h3>
          <div className={styles.vennSelect}>
            <label>Select up to 3 Competitors:</label>
            <Select
              isMulti
              options={vennCompetitorOptions}
              value={vennCompetitorOptions.filter((option) => selectedVennCompetitors.includes(option.value))}
              onChange={handleVennCompetitorChange}
              maxMenuHeight={150}
              styles={{
                container: (provided) => ({
                  ...provided,
                  minWidth: '250px',
                }),
              }}
            />
          </div>
          <div className={styles.vennDiagram}>
            {vennOptions && (
              <HighchartsReact
                highcharts={Highcharts}
                options={vennOptions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Competitive Positioning Chart */}
      <div className={styles.competitivePositioningSection}>
        <h3>Competitive Positioning</h3>
        <div className={styles.filterContainer}>
          <label>Select Competitors:</label>
          <Select
            isMulti
            options={competitorOptions}
            value={competitorOptions.filter(option => selectedCompetitorDomains.includes(option.value))}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions.map(option => option.value);
              setSelectedCompetitorDomains(selectedValues);
            }}
            styles={{
              container: (provided) => ({
                ...provided,
                minWidth: '250px',
              }),
            }}
          />
        </div>
        <div className={styles.competitorCharts}>
          <div
            className={`${styles.chartItem} ${styles.larger}`}
            style={{ gridColumn: 'span 4', }}
          >
            <canvas ref={competitivePositioningChartRef} height="400"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainOverview;
