// components/audit/domain-overview/DomainOverview.js

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import exportingInit from 'highcharts/modules/exporting';
import offlineExporting from 'highcharts/modules/offline-exporting';
import vennInit from 'highcharts/modules/venn';
import highchartsMore from 'highcharts/highcharts-more.js';
import styles from './DomainOverview.module.css';
import {
  FaInfoCircle,
  FaLocationArrow,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaLink,
  FaStar,
  FaRobot,
  FaDownload,
} from 'react-icons/fa';
import axios from 'axios';
import qs from 'qs';
import { MdFeaturedPlayList } from 'react-icons/md';
import Select from 'react-select';

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
  // Refs for Highcharts components
  const trendChartRef = useRef(null);
  const intentChartRef = useRef(null);
  const rankingDistributionRef = useRef(null);
  const competitiveChartRef = useRef(null);
  const vennChartRef = useRef(null);

  // State variables
  const [trafficType, setTrafficType] = useState('organic'); // 'organic' or 'paid' (used in Country Distribution)
  const [rankingTrafficType, setRankingTrafficType] = useState('organic'); // 'organic' or 'paid' (used in Ranking Distribution)
  const [selectedMetric, setSelectedMetric] = useState('traffic_sum');
  const [dateRange, setDateRange] = useState('12');
  const [keywordTab, setKeywordTab] = useState('all'); // 'all', 'improved', 'decreased', 'new', 'lost'

  const [trendChartOptions, setTrendChartOptions] = useState(null);
  const [intentChartOptions, setIntentChartOptions] = useState(null);
  const [rankingDistributionOptions, setRankingDistributionOptions] = useState(null);
  const [competitiveChartOptions, setCompetitiveChartOptions] = useState(null);
  const [vennOptions, setVennOptions] = useState(null);
  const [isHighchartsReady, setIsHighchartsReady] = useState(false);

  const [selectedCompetitorDomains, setSelectedCompetitorDomains] = useState([]);
  const [intentData, setIntentData] = useState([]);
  const [filteredOrganicKeywords, setFilteredOrganicKeywords] = useState([]);
  const [serpFeatures, setSerpFeatures] = useState([]);
  const [selectedVennCompetitors, setSelectedVennCompetitors] = useState([]);
  const [competitorKeywordsData, setCompetitorKeywordsData] = useState({});

  // Initialize Highcharts modules
useEffect(() => {
  if (typeof window !== 'undefined' && typeof Highcharts === 'object') {
    highchartsMore(Highcharts); // Initialize Highcharts More module
    vennInit(Highcharts);       // Initialize Venn module
    exportingInit(Highcharts);  // Initialize Exporting module
    offlineExporting(Highcharts); // Initialize Offline Exporting module
    setIsHighchartsReady(true);
  }
}, []);

  // Fetch Intent Data
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

  // Handle AI Insights and Downloads
  const handleAIInsights = () => {
    alert('AI Insights coming soon!');
  };

  const handleDownloadTrendChart = () => {
    if (trendChartRef.current && trendChartRef.current.chart) {
      trendChartRef.current.chart.exportChartLocal();
    }
  };

  const handleDownloadIntentChart = () => {
    if (intentChartRef.current && intentChartRef.current.chart) {
      intentChartRef.current.chart.exportChartLocal();
    }
  };

  const handleDownloadRankingChart = () => {
    if (rankingDistributionRef.current && rankingDistributionRef.current.chart) {
      rankingDistributionRef.current.chart.exportChartLocal();
    }
  };

  const handleDownloadVennChart = () => {
    if (vennChartRef.current && vennChartRef.current.chart) {
      vennChartRef.current.chart.exportChartLocal();
    }
  };

  const handleDownloadCompetitiveChart = () => {
    if (competitiveChartRef.current && competitiveChartRef.current.chart) {
      competitiveChartRef.current.chart.exportChartLocal();
    }
  };

  // Prepare data for the trend chart
  const trendData = overviewData.history || [];

  // Prepare data for country distribution
  const countryData = overviewData.overview?.[trafficType]?.countries || [];

  // Prepare data for organic competitors
  const organicCompetitors = overviewData.competitors || [];

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
      name: 'Traffic.',
      selector: (row) => row.traffic,
      sortable: true,
    },
    {
      name: 'Position',
      selector: (row) => row.position,
      sortable: true,
      cell: (row) => {
        const positionChange = row.prev_pos ? row.prev_pos - row.position : null;
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
            <small>{positionChange}</small>
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
      name: 'Traffic',
      selector: (row) => row.traffic_sum,
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
      case 'local_pack':
        return <FaLocationArrow title="Local Pack" className={styles.blockIcon} />;
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

  // Build Highcharts options for Trend Chart
  useEffect(() => {
    if (isHighchartsReady && trendData.length > 0) {
      // Determine months to show based on dateRange
      const monthsToShow = dateRange === 'All' ? Infinity : parseInt(dateRange);
      const limitedData =
        monthsToShow !== Infinity ? trendData.slice(-monthsToShow) : trendData;

      const categories = limitedData.map((item) => `${item.month}/${item.year}`);
      const data = limitedData.map((item) => item[selectedMetric] || 0);

      const options = {
        chart: {
          type: 'spline',
        },
        title: {
          text:
            selectedMetric === 'traffic_sum'
              ? 'Total Traffic'
              : selectedMetric === 'keywords_count'
              ? 'Keywords'
              : 'Traffic Cost',
        },
        xAxis: {
          categories: categories,
        },
        yAxis: {
          title: {
            text: null,
          },
        },
        series: [
          {
            name:
              selectedMetric === 'traffic_sum'
                ? 'Total Traffic'
                : selectedMetric === 'keywords_count'
                ? 'Keywords'
                : 'Traffic Cost',
            data: data,
          },
        ],
        responsive: {
          rules: [{
              condition: {
                  maxWidth: 500,
                  maxHeight:200
              },
              chartOptions: {
                  legend: {
                      layout: 'horizontal',
                      align: 'center',
                      verticalAlign: 'bottom'
                  }
              }
          }]
      }
      };

      setTrendChartOptions(options);
    }
  }, [isHighchartsReady, overviewData, selectedMetric, dateRange]);

  // Build Highcharts options for Intent Chart
  useEffect(() => {
    if (isHighchartsReady && intentData.length > 0) {
      const categories = intentData.map((item) => item.intent);
      const data = intentData.map((item) => item.keywords);

      const options = {
        chart: {
          type: 'column',
        },
        title: {
          text: 'Keywords by Intent',
        },
        xAxis: {
          categories: categories,
          title: {
            text: null,
          },
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Number of Keywords',
            align: 'high',
          },
          labels: {
            overflow: 'justify',
          },
        },
        tooltip: {
          valueSuffix: ' keywords',
        },
        plotOptions: {
          column: {
            dataLabels: {
              enabled: true,
            },
          },
        },
        series: [
          {
            name: 'Keywords',
            data: data,
          },
        ],
      };

      setIntentChartOptions(options);
    }
  }, [isHighchartsReady, intentData]);

   // Similarly, update SERP Features section
   const getSERPFeatureIcon = (feature) => {
    switch (feature) {
      case 'sitelinks':
        return <FaLink title="Sitelinks" className={styles.serpFeatureIcon} />;
      case 'reviews':
        return <FaStar title="Reviews" className={styles.serpFeatureIcon} />;
      case 'local_pack':
        return (
          <FaLocationArrow title="Local Pack" className={styles.serpFeatureIcon} />
        );
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

  // Build Highcharts options for Ranking Distribution Chart
  useEffect(() => {
    if (
      isHighchartsReady &&
      overviewData.overview &&
      overviewData.overview[rankingTrafficType]
    ) {
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

      const categories = ranges.map((r) => r.range);
      const dataValues = ranges.map((r) => (r.count / totalKeywords) * 100);

      const options = {
        chart: {
          type: 'column',
        },
        title: {
          text: 'Distribution of Keyword Rankings',
        },
        xAxis: {
          categories: categories,
          title: {
            text: 'Position Ranges',
          },
        },
        yAxis: {
          min: 0,
          title: {
            text: '% of Keywords',
          },
        },
        tooltip: {
          valueSuffix: '%',
        },
        plotOptions: {
          column: {
            dataLabels: {
              enabled: true,
              format: '{y:.2f}%',
            },
          },
        },
        series: [
          {
            name: '% of Keywords',
            data: dataValues,
          },
        ],
      };

      setRankingDistributionOptions(options);
    }
  }, [isHighchartsReady, rankingTrafficType, overviewData]);

  // Prepare data for Venn Diagram
  useEffect(() => {
    if (isHighchartsReady) {
      buildVennDiagramOptions();
    }
  }, [isHighchartsReady, selectedVennCompetitors, overviewData]);

  const buildVennDiagramOptions = () => {
    if (
      selectedVennCompetitors.length >= 2 &&
      overviewData &&
      overviewData.overview &&
      overviewData.overview.organic
    ) {
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
            const competitorDomain = domainA === ownDomain ? domainB : domainA;
            const competitorData = domainData[competitorDomain];
            overlapSize = competitorData.common_keywords[ownDomain] || 0;
          } else {
            const competitorDataA = domainData[domainA];
            const competitorDataB = domainData[domainB];
            overlapSize =
              Math.min(
                competitorDataA.total_keywords,
                competitorDataB.total_keywords
              ) * 0.1;
          }

          data.push({
            sets: [domainA, domainB],
            value: overlapSize,
            name: `Overlap between ${domainA} and ${domainB}`,
          });
        }
      }

      // Add triple overlap if 3 domains selected
      if (selectedDomains.length === 3) {
        const [domainA, domainB, domainC] = selectedDomains;
        const competitorDataA = domainData[domainA];
        const competitorDataB = domainData[domainB];
        const competitorDataC = domainData[domainC];

        const minTotalKeywords = Math.min(
          competitorDataA.total_keywords,
          competitorDataB.total_keywords,
          competitorDataC.total_keywords
        );

        const tripleOverlapSize = minTotalKeywords * 0.05;

        data.push({
          sets: [domainA, domainB, domainC],
          value: tripleOverlapSize,
          name: `Overlap among ${domainA}, ${domainB}, and ${domainC}`,
        });
      }

      const options = {
        series: [
          {
            type: 'venn',
            data: data,
            name: 'Domain Overlaps',
            dataLabels: {
              style: {
                fontSize: '15px',
                textOutline: 'none',
              },
            },
          },
        ],
        title: {
          text: 'Organic Competitor Semantics Comparison',
        },
        tooltip: {
          headerFormat: '',
          pointFormatter: function () {
            if (this.sets.length === 1) {
              return `<b>${this.name}</b><br>Keywords: ${this.value}`;
            } else {
              return `<b>${this.name}</b><br>Overlap Keywords: ${this.value}`;
            }
          },
        },
      };

      setVennOptions(options);
    }
  };

  // Build Highcharts options for Competitive Positioning Chart
  useEffect(() => {
    if (
      isHighchartsReady &&
      overviewData &&
      overviewData.overview &&
      overviewData.overview.organic
    ) {
      const userDomain =
        overviewData.overview.organic.base_domain || 'Your Domain';
      const userTotalKeywords =
        overviewData.overview.organic.keywords_count || 0;
      const ownOrganicTrafficSum =
        overviewData.overview.organic.traffic_sum || 1; // Prevent division by zero

      const selectedCompData = allCompetitors.filter((c) =>
        selectedCompetitorDomains.includes(c.domain)
      );

      const totalOrganicTraffic =
        ownOrganicTrafficSum +
        selectedCompData.reduce((acc, c) => acc + (c.traffic_sum || 0), 0);

      const allDataPoints = [];

      if (selectedCompetitorDomains.includes(userDomain)) {
        const ownTrafficPercentage =
          Number(
            ((ownOrganicTrafficSum / totalOrganicTraffic) * 100).toFixed(2)
          ) || 0;

        const ownDataPoint = {
          name: userDomain,
          x: userTotalKeywords,
          y: ownTrafficPercentage,
          z: ownOrganicTrafficSum,
        };

        allDataPoints.push(ownDataPoint);
      }

      selectedCompData.forEach((c) => {
        const x = c.total_keywords || 0;
        const y =
          Number(((c.traffic_sum / totalOrganicTraffic) * 100).toFixed(2)) ||
          0;

        const dataPoint = {
          name: c.domain,
          x,
          y,
          z: c.traffic_sum,
        };

        allDataPoints.push(dataPoint);
      });

      const options = {
        chart: {
          type: 'bubble',
          plotBorderWidth: 1,
          zoomType: 'xy',
        },
        title: {
          text: 'Competitive Positioning',
        },
        xAxis: {
          title: {
            text: 'Keywords',
          },
          gridLineWidth: 1,
        },
        yAxis: {
          title: {
            text: 'Organic Traffic Share (%)',
          },
        },
        tooltip: {
          useHTML: true,
          headerFormat: '<table>',
          pointFormat:
            '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
            '<tr><th>Keywords:</th><td>{point.x}</td></tr>' +
            '<tr><th>Traffic Share:</th><td>{point.y}%</td></tr>' +
            '<tr><th>Traffic Sum:</th><td>{point.z}</td></tr>',
          footerFormat: '</table>',
          followPointer: true,
        },
        plotOptions: {
          bubble: {
            minSize: 10,
            maxSize: 60,
          },
        },
        series: [
          {
            data: allDataPoints,
          },
        ],
      };

      setCompetitiveChartOptions(options);
    }
  }, [isHighchartsReady, selectedCompetitorDomains, overviewData]);

  // Fetch Competitor Keywords Data
  useEffect(() => {
    if (selectedCompetitorDomains.length > 0) {
      fetchCompetitorKeywordsData();
    }
  }, [selectedCompetitorDomains]);

  const fetchCompetitorKeywordsData = async () => {
    const ownDomain = overviewData.overview?.organic?.base_domain || 'N/A';
    const competitors = selectedCompetitorDomains.filter((d) => d !== ownDomain);

    if (!competitors.length) {
      console.warn('No competitors selected. Skipping API call.');
      return;
    }

    console.log('Fetching competitor keywords data for:', competitors);

    const fetchData = async (retryCount = 0) => {
      try {
        const response = await axios.get('/api/audit/overview/research', {
          params: {
            domain: ownDomain,
            competitors: competitors,
            type: 'organic',
          },
          paramsSerializer: (params) => {
            return qs.stringify(params, { arrayFormat: 'repeat' });
          },
        });
        setCompetitorKeywordsData(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            if (error.response.status === 429) {
              if (retryCount < 3) {
                console.warn(
                  `Received 429 Too Many Requests. Retrying after 5 seconds... (Attempt ${
                    retryCount + 1
                  })`
                );
                setTimeout(() => {
                  fetchData(retryCount + 1);
                }, 5000);
              } else {
                console.error(
                  'Max retries reached. Cannot fetch competitor keywords data.'
                );
              }
            } else if (error.response.status === 500) {
              console.error('Server error (500). Ignoring the error.');
            } else {
              console.error(
                `Error fetching competitor keywords data: ${error.message}`
              );
            }
          } else {
            console.error(
              `Error fetching competitor keywords data: ${error.message}`
            );
          }
        } else {
          console.error('Unexpected error:', error);
        }
      }
    };

    fetchData();
  };

  useEffect(() => {
    if (overviewData && allCompetitors.length > 0) {
      const ownDomain = overviewData.overview?.organic?.base_domain || 'N/A';
      const defaultCompetitors = allCompetitors
        .slice(0, 2)
        .map((comp) => comp.domain);
      const competitorsWithoutOwnDomain = defaultCompetitors.filter(
        (domain) => domain !== ownDomain
      );
      setSelectedCompetitorDomains([ownDomain, ...competitorsWithoutOwnDomain]);
    }
  }, [overviewData, allCompetitors]);

  useEffect(() => {
    const ownDomain = overviewData.overview?.organic?.base_domain || 'N/A';
    const competitors = selectedCompetitorDomains.filter((d) => d !== ownDomain);

    if (competitors.length > 0) {
      fetchCompetitorKeywordsData();
    } else {
      console.warn('No valid competitors selected. Skipping fetch.');
    }
  }, [selectedCompetitorDomains, overviewData]);

  const prepareTableData = () => {
    const ownDomain = overviewData.overview?.organic?.base_domain || 'N/A';
    const combinedData = {};

    // Fetch own domain's data from the first competitor's compare_* fields
    const firstCompetitor = selectedCompetitorDomains.find(
      (comp) => comp !== ownDomain
    );
    if (!firstCompetitor || !competitorKeywordsData[firstCompetitor]) {
      console.warn('No competitor data available to extract own domain data');
      return []; // No data available
    }

    competitorKeywordsData[firstCompetitor]?.forEach((item) => {
      combinedData[item.keyword] = {
        keyword: item.keyword,
        volume: item.volume,
        [ownDomain]: {
          position: item.compare_position,
          traffic: item.compare_traffic,
          price: item.compare_price,
        },
        [firstCompetitor]: {
          position: item.position,
          traffic: item.traffic,
          price: item.price,
        },
      };
    });

    // Include data from other competitors
    selectedCompetitorDomains.forEach((comp) => {
      if (comp === ownDomain || comp === firstCompetitor) return;

      competitorKeywordsData[comp]?.forEach((item) => {
        if (!combinedData[item.keyword]) {
          combinedData[item.keyword] = {
            keyword: item.keyword,
            volume: item.volume,
          };
        }
        combinedData[item.keyword][comp] = {
          position: item.position,
          traffic: item.traffic,
          price: item.price,
        };
      });
    });

    return Object.values(combinedData);
  };

  const tableData = prepareTableData();

  const columns = [
    {
      name: 'Keyword',
      selector: (row) => row.keyword || '',
      sortable: true,
      wrap: true,
      frozen: true,
    },
    {
      name: 'Volume',
      selector: (row) => row.volume || 0,
      sortable: true,
      format: (row) => row.volume || '-',
    },
    ...selectedCompetitorDomains.flatMap((comp) => [
      {
        name: `${comp} Position`,
        selector: (row) =>
          row[comp] && row[comp].position !== undefined
            ? parseFloat(row[comp].position)
            : null,
        sortable: true,
        format: (row) => row[comp]?.position || '-',
      },
      {
        name: `${comp} Traffic`,
        selector: (row) =>
          row[comp] && row[comp].traffic !== undefined
            ? parseFloat(row[comp].traffic)
            : null,
        sortable: true,
        format: (row) => row[comp]?.traffic || '-',
      },
      {
        name: `${comp} Price`,
        selector: (row) =>
          row[comp] && row[comp].price !== undefined
            ? parseFloat(row[comp].price)
            : null,
        sortable: true,
        format: (row) => row[comp]?.price || '-',
      },
    ]),
  ];

  // Prepare options for react-select for Venn Diagram
  useEffect(() => {
    const ownDomain = overviewData.overview?.organic?.base_domain || 'N/A';
    // Default to own domain and top 2 competitors
    const defaultCompetitors = [
      ownDomain,
      ...allCompetitors.slice(0, 2).map((comp) => comp.domain),
    ].slice(0, 3); // Limit to max 3 domains
    setSelectedVennCompetitors(defaultCompetitors);
  }, [overviewData, allCompetitors]);

  const vennCompetitorOptions = [
    {
      value: overviewData.overview?.organic?.base_domain || 'N/A',
      label: overviewData.overview?.organic?.base_domain || 'N/A',
    },
    ...allCompetitors.map((comp) => ({ value: comp.domain, label: comp.domain })),
  ];

  const handleVennCompetitorChange = (selectedOptions) => {
    if (selectedOptions.length > 3) {
      selectedOptions = selectedOptions.slice(0, 3);
    }
    setSelectedVennCompetitors(selectedOptions.map((option) => option.value));
  };

  // Prepare options for react-select for Competitive Positioning
  const competitorOptions = [
    {
      value: overviewData.overview?.organic?.base_domain || 'N/A',
      label: overviewData.overview?.organic?.base_domain || 'N/A',
    },
    ...allCompetitors.map((c) => ({ value: c.domain, label: c.domain })),
  ];

  return (
    <div className={styles.overview}>
      <h2>
        Domain Overview for {overviewData.overview?.organic?.base_domain || 'N/A'}
      </h2>
  
      {/* First Row: Metrics */}
      <div className={styles.metricsRow}>
        {/* Column 1: Domain Trust and Page Trust */}
        <div className={`${styles.metricBox}`}>
          <div className={styles.eachBlock}>
            <div className={styles.metricHeader}>
              <h3>
                Domain Trust{' '}
                <FaInfoCircle
                  className={styles.infoIcon}
                  title="Domain Trust is a metric..."
                />
              </h3>
              <div className={styles.iconContainer}>
                <FaRobot className={styles.actionIcon} title="AI Insights" />
                <FaDownload className={styles.actionIcon} title="Download Data" />
              </div>
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
          <div className={`${styles.bottomMetric} ${styles.domainColor}`}></div>
        </div>
  
        {/* Column 2: Organic Traffic */}
        <div className={`${styles.metricBox}`}>
          <div className={styles.eachBlock}>
            <div className={styles.metricHeader}>
              <h3>
                Organic Traffic{' '}
                <FaInfoCircle
                  className={styles.infoIcon}
                  title="Organic Traffic is..."
                />
              </h3>
            </div>
            <div className={styles.metricCont}>
              <div className={styles.metricValue}>
                {overviewData.overview?.organic?.traffic_sum ?? 'N/A'}
              </div>
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
          <div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>
        </div>
  
        {/* Column 3: Paid Traffic */}
        <div className={`${styles.metricBox}`}>
          <div className={styles.eachBlock}>
            <div className={styles.metricHeader}>
              <h3>
                Paid Traffic{' '}
                <FaInfoCircle
                  className={styles.infoIcon}
                  title="Paid Traffic is..."
                />
              </h3>
              <div className={styles.iconContainer}>
                <FaRobot className={styles.actionIcon} title="AI Insights" />
                <FaDownload className={styles.actionIcon} title="Download Data" />
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
          <div className={`${styles.bottomMetric} ${styles.paidColor}`}></div>
        </div>
  
        {/* Column 4: Referring Domains and Backlinks */}
        <div className={`${styles.metricBox}`}>
          <div className={styles.eachBlock}>
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
          <div className={`${styles.bottomMetric} ${styles.linksColor}`}></div>
        </div>
      </div>
  
      {/* Second Row */}
      <div className={styles.secondRow}>
        {/* Column 1: Traffic Distribution by Country */}
        
        <div className={styles.countryDistribution}>
        <div className={styles.eachBlock}>

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
        </div>
  
        {/* Column 2: Trend Chart */}
        <div className= {`${styles.trendChartContainer} ${styles.larger}`}>
          <div className={styles.tabHeader}>
            {metricOptions.map((metric, idx) => (
              <button
                key={idx}
                className={selectedMetric === metric.value ? styles.activeTab : ''}
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
            <div className={styles.chartHeader}>
              <div className={styles.iconContainer}>
                <FaRobot
                  className={styles.actionIcon}
                  title="AI Insights"
                  onClick={handleAIInsights}
                />
                <FaDownload
                  className={styles.actionIcon}
                  title="Download Data"
                  onClick={handleDownloadTrendChart}
                />
              </div>
            </div>
            {isHighchartsReady && trendChartOptions && (
              <HighchartsReact
                highcharts={Highcharts}
                options={trendChartOptions}
                ref={trendChartRef}
              />
            )}
          </div>
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
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
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
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
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
        </div>
      </div>
  
      {/* Keyword by Intent Section */}
      <div className={styles.intentSection}>
        <h3>Keyword by Intent</h3>
        <div className={styles.intentChartContainer}>
          <div className={styles.chartHeader}>
            <div className={styles.iconContainer}>
              <FaRobot
                className={styles.actionIcon}
                title="AI Insights"
                onClick={handleAIInsights}
              />
              <FaDownload
                className={styles.actionIcon}
                title="Download Data"
                onClick={handleDownloadIntentChart}
              />
            </div>
          </div>
          {isHighchartsReady && intentChartOptions && (
            <HighchartsReact
              highcharts={Highcharts}
              options={intentChartOptions}
              ref={intentChartRef}
            />
          )}
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
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
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
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
      </div>
  
      {/* Distribution Row */}
      <div className={styles.distributionRow}>
        {/* Distribution of Keyword Rankings */}
        <div className={styles.distributionSection}>
          <div className={styles.tabHeader}>
            <button
              className={rankingTrafficType === 'organic' ? styles.activeTab : ''}
              onClick={() => setRankingTrafficType('organic')}
            >
              Organic
            </button>
            <button
              className={rankingTrafficType === 'adv' ? styles.activeTab : ''}
              onClick={() => setRankingTrafficType('adv')}
            >
              Paid
            </button>
          </div>
          <h3>Distribution of Keyword Rankings</h3>
          <div className={styles.distributionChartContainer}>
            <div className={styles.chartHeader}>
              <div className={styles.iconContainer}>
                <FaRobot
                  className={styles.actionIcon}
                  title="AI Insights"
                  onClick={handleAIInsights}
                />
                <FaDownload
                  className={styles.actionIcon}
                  title="Download Data"
                  onClick={handleDownloadRankingChart}
                />
              </div>
            </div>
            {isHighchartsReady && rankingDistributionOptions && (
              <HighchartsReact
                highcharts={Highcharts}
                options={rankingDistributionOptions}
                ref={rankingDistributionRef}
              />
            )}
          </div>
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
        </div>
  
        {/* Organic Competitor Semantics Comparison */}
        <div className={styles.vennSection}>
          <h3>Organic Competitor Semantics Comparison</h3>
          <div className={styles.vennSelect}>
            <label>Select up to 3 Competitors:</label>
            <Select
              isMulti
              options={vennCompetitorOptions}
              value={vennCompetitorOptions.filter((option) =>
                selectedVennCompetitors.includes(option.value)
              )}
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
            <div className={styles.chartHeader}>
              <div className={styles.iconContainer}>
                <FaRobot
                  className={styles.actionIcon}
                  title="AI Insights"
                  onClick={handleAIInsights}
                />
                <FaDownload
                  className={styles.actionIcon}
                  title="Download Data"
                  onClick={handleDownloadVennChart}
                />
              </div>
            </div>
            {isHighchartsReady && vennOptions && (
              <HighchartsReact
                highcharts={Highcharts}
                options={vennOptions}
                ref={vennChartRef}
              />
            )}
          </div>
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
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
            value={competitorOptions.filter((option) =>
              selectedCompetitorDomains.includes(option.value)
            )}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions.map((option) => option.value);
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
            style={{ gridColumn: 'span 4' }}
          >
            <div className={styles.chartHeader}>
              <div className={styles.iconContainer}>
                <FaRobot
                  className={styles.actionIcon}
                  title="AI Insights"
                  onClick={handleAIInsights}
                />
                <FaDownload
                  className={styles.actionIcon}
                  title="Download Data"
                  onClick={handleDownloadCompetitiveChart}
                />
              </div>
            </div>
            {isHighchartsReady && competitiveChartOptions && (
              <HighchartsReact
                highcharts={Highcharts}
                options={competitiveChartOptions}
                ref={competitiveChartRef}
              />
            )}
          </div>
        </div>
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
      </div>
  
      {/* Competitive Keywords Table */}
      <div className={styles.competitorKeywordsSection}>
        <h3>Keywords Breakdown by Competitor</h3>
        <div className={styles.filterContainer}>
          <label>Select Competitors:</label>
          <Select
            isMulti
            options={allCompetitors.map((comp) => ({
              value: comp.domain,
              label: comp.domain,
            }))}
            value={selectedCompetitorDomains.map((domain) => ({
              value: domain,
              label: domain,
            }))}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions.map((option) => option.value);
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
        <DataTable
          columns={columns}
          data={tableData}
          pagination
          paginationPerPage={10}
          highlightOnHover
          striped
        />
          {/*<div className={`${styles.bottomMetric} ${styles.organicColor}`}></div>*/}
      </div>
    </div>
  );
  
};

export default DomainOverview;
