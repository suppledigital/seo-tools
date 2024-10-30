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
}) => {
  // Refs for Chart.js canvases
  const chartInstances = useRef({});
  const trafficTrendChartRef = useRef(null);
  const organicVsPaidChartRef = useRef(null);
  const topKeywordsChartRef = useRef(null);
  const competitivePositioningChartRef = useRef(null);

  // Effect to render charts when overviewData or selectedCompetitors change
  useEffect(() => {
    if (overviewData) {
      renderTrafficTrendChart();
      renderOrganicVsPaidChart();
      renderTopKeywordsChart();
      renderCompetitivePositioningChart();
    }

    // Cleanup charts on unmount
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
    if (competitivePositioningChartRef.current && selectedCompetitors.length > 0) {
      const ctx = competitivePositioningChartRef.current.getContext('2d');
      if (chartInstances.current['competitivePositioningChart']) {
        chartInstances.current['competitivePositioningChart'].destroy();
      }

      const userDomain = overviewData.overview.organic?.base_domain || 'Your Domain';
      const userTotalKeywords = overviewData.overview.organic?.keywords_count || 0;
      const userTrafficShare = overviewData.overview.organic?.traffic_share || 0;

      const datasets = [
        {
          label: userDomain,
          data: [
            {
              x: userTotalKeywords,
              y: userTrafficShare,
              r: 10,
            },
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        ...selectedCompetitors.map((competitor) => ({
          label: competitor.domain,
          data: [
            {
              x: competitor.keywords || 0,
              y: competitor.traffic_share || 0,
              r: (competitor.difficulty || 1) * 2,
            },
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        })),
      ];

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
              position: 'right',
              labels: {
                boxWidth: 20,
                padding: 15,
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

          {/* Competitors Selection */}
          <div className={styles.competitorsSelect}>
            <label htmlFor="competitors">Select Competitors (up to 4):</label>
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
                const selectedComps = allCompetitors.filter((comp) => selected.includes(comp.domain));

                // Limit to 4 competitors
                if (selectedComps.length <= 4) {
                  setSelectedCompetitorDomains(selected);
                  setSelectedCompetitors(selectedComps);
                } else {
                  alert('You can select up to 4 competitors.');
                }
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
            {/* VennChart is currently disabled/commented out */}
            {/* <div className={`${styles.chartItem} ${styles.larger}`}>
              <h4>Keyword Share Between Domains</h4>
              <VennChart options={constructVennOptions()} />
            </div> */}
            <div className={`${styles.chartItem} ${styles.larger}`} style={{ height: '400px' }}>
              <h4>Competitive Positioning</h4>
              {selectedCompetitors.length > 0 && (
                <>
                  <Slider {...carouselSettings}>
                    {selectedCompetitors.map((competitor, index) => (
                      <div key={index} className={styles.carouselItem}>
                        <div className={styles.carouselContent}>
                          <h5>{competitor.domain}</h5>
                          <p>Common Keywords: {competitor.common_keywords}</p>
                          <p>Traffic Sum: {competitor.traffic_sum}</p>
                          {/* Add more competitor details as needed */}
                        </div>
                      </div>
                    ))}
                  </Slider>
                  <canvas ref={competitivePositioningChartRef}></canvas>
                </>
              )}
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
