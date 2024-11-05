// components/audit/domain-overview/DomainOverview.js
import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './DomainOverview.module.css';
import SortableTable from '../../common/SortableTable';

// Dynamically import Slider with SSR disabled to prevent SSR issues
const Slider = dynamic(() => import('react-slick'), { ssr: false });

// Import slick-carousel CSS for Slider styling
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Import Chart.js
import { Chart } from 'chart.js';

const DomainOverview = ({
  overviewData,
  loadingOverview,
  sortedOrganicKeywords,
  sortedPaidKeywords,
  allCompetitors,
  selectedCompetitors,
  setSelectedCompetitors,
  selectedCompetitorDomains,
  setSelectedCompetitorDomains,
  setCurrentTab
}) => {
 // Refs for Chart.js canvases
 const chartInstances = useRef({});
 const trafficTrendChartRef = useRef(null);
 const organicVsPaidChartRef = useRef(null);
 const topKeywordsChartRef = useRef(null);
 const competitivePositioningChartRef = useRef(null);

 // Update the useEffect to render the chart when selectedCompetitors change
 useEffect(() => {
  if (overviewData) {
    renderTrafficTrendChart();
    renderOrganicVsPaidChart();
    renderTopKeywordsChart();
  }
  if (selectedCompetitors.length > 0) {
    renderCompetitivePositioningChart();
  }

  console.log('Selected Competitors:', selectedCompetitors);

  return () => {
    Object.values(chartInstances.current).forEach((chart) => {
      if (chart) chart.destroy();
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [overviewData, selectedCompetitors]);



  // Define columns for Organic Keywords
  const organicColumns = [
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
  ];

  // Define columns for Paid Keywords
  const paidColumns = [
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
  ];

  // Define carousel settings
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

  // Chart Rendering Functions

  const renderTrafficTrendChart = () => {
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
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Month/Year',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Traffic Sum',
              },
              beginAtZero: true,
            },
          },
        },
      });
    }
  };

  const renderOrganicVsPaidChart = () => {
    if (organicVsPaidChartRef.current && overviewData.overview) {
      const ctx = organicVsPaidChartRef.current.getContext('2d');
      if (chartInstances.current['organicVsPaidChart']) {
        chartInstances.current['organicVsPaidChart'].destroy();
      }

      const organicKeywords = overviewData.overview.organic?.keywords_count || 0;
      const paidKeywords = Array.isArray(overviewData.overview.adv)
        ? overviewData.overview.adv.length
        : overviewData.overview.adv?.keywords_count || 0;

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
              tooltip: {
                enabled: true,
              },
            },
          },
        });
      }
    }
  };

  const renderTopKeywordsChart = () => {
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
            tooltip: {
              enabled: true,
            },
          },
          scales: {
            x: { beginAtZero: true, reverse: true },
            y: {
              title: {
                display: true,
                text: 'Position',
              },
            },
          },
        },
      });
    }
  };

  const renderCompetitivePositioningChart = () => {
    if (
      competitivePositioningChartRef.current &&
      selectedCompetitors.length > 0 &&
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

      // Calculate total organic traffic including competitors
      const totalOrganicTraffic =
        ownOrganicTrafficSum +
        selectedCompetitors.reduce((acc, c) => acc + (c.traffic_sum || 0), 0);

      // Determine the maximum competition value among competitors and your domain
      const maxCompetition = Math.max(
        ...selectedCompetitors.map((c) => c.common_keywords || 0),
        userTotalKeywords
      );

      const fixedMaxRadius = 20; // Fixed radius for the highest competition

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
      const competitorColors = selectedCompetitors.map(
        (_, idx) => colorPalette[idx % colorPalette.length]
      );

      // Create datasets for each competitor
      const competitorDatasets = selectedCompetitors.map((c, idx) => {
        const x = c.common_keywords || 0;
        const y =
          Number(((c.traffic_sum / totalOrganicTraffic) * 100).toFixed(2)) || 0;
        const r =
          maxCompetition > 0
            ? (c.common_keywords / maxCompetition) * fixedMaxRadius
            : fixedMaxRadius;

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
        x: userTotalKeywords, // Number of organic keywords
        y:
          Number(
            ((ownOrganicTrafficSum / totalOrganicTraffic) * 100).toFixed(2)
          ) || 0, // Organic traffic share as percentage
        r:
          maxCompetition > 0
            ? (userTotalKeywords / maxCompetition) * fixedMaxRadius
            : fixedMaxRadius,
      };

      const ownDataset = {
        label: userDomain,
        data: [ownDataPoint],
        backgroundColor: 'rgba(255, 99, 132, 0.9)', // Distinct color for your domain
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(255, 99, 132, 1)',
        hoverBorderColor: 'rgba(255, 99, 132, 1)',
      };

      // Combine all datasets
      const allDatasets = [ownDataset, ...competitorDatasets];

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

  // Function to scroll the Advertising Table
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

  return (
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
        <div className={styles.chartItem} style={{ gridColumn: 'span 2', height: '300px' }}>
          {loadingOverview ? (
            <p>Loading...</p>
          ) : overviewData.history && overviewData.history.length > 0 ? (
            <canvas ref={trafficTrendChartRef}></canvas>
          ) : (
            <p>No traffic trend data available.</p>
          )}
        </div>
        <div className={styles.chartItem} style={{ height: '300px' }}>
          <h3>Organic vs Paid Keywords</h3>
          {(overviewData.overview?.organic?.keywords_count > 0 ||
            (Array.isArray(overviewData.overview?.adv) && overviewData.overview.adv.length > 0)) ? (
            <canvas ref={organicVsPaidChartRef}></canvas>
          ) : (
            <p>No data available for Organic vs Paid Keywords.</p>
          )}
        </div>
        <div className={styles.chartItem} style={{ height: '300px' }}>
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

          <div className={styles.competitorsSelect}>
            <label htmlFor="competitors">Select Competitors:</label>
            <select
              id="competitors"
              multiple
              value={selectedCompetitorDomains}
              onChange={(e) => {
                const options = e.target.options;
                const selected = [];
                for (let i = 0; i < options.length; i++) {
                  if (options[i].selected) {
                    selected.push(options[i].value);
                  }
                }
                const selectedComps = allCompetitors.filter((comp) =>
                  selected.includes(comp.domain)
                );

                // Removed limit to allow selecting as many competitors as desired
                setSelectedCompetitorDomains(selected);
                setSelectedCompetitors(selectedComps);
              }}
            >
              {allCompetitors.map((competitor, idx) => (
                <option key={idx} value={competitor.domain}>
                  {competitor.domain}
                </option>
              ))}
            </select>
          </div>

          {/* Competitor Charts */}
          <div className={styles.competitorCharts}>
          <h4>Competitive Positioning</h4>

            <div
              className={`${styles.chartItem} ${styles.larger}`}
              style={{ gridColumn: 'span 4', height: '400px' }} // Made the canvas full width
            >
              {selectedCompetitors.length > 0 && (
                <canvas ref={competitivePositioningChartRef}></canvas>
              )}
            </div>
            <div className={styles.viewAllLink}>
              <button onClick={() => setCurrentTab('Competitor Analysis')} className={styles.viewAllButton}>
                View all competition info
              </button>
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
                      <a href={keyword.snippet_display_url} target="_blank" rel="noopener noreferrer" className={styles.snippetDisplayUrl}>
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
  );
};

export default DomainOverview;
