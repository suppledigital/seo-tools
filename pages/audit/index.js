import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './index.module.css';
import { Chart, registerables } from 'chart.js';
// Import FontAwesome components and icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faTimesCircle,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

Chart.register(...registerables);

export default function AuditHome() {
  const [audits, setAudits] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [auditResults, setAuditResults] = useState(null);
  const chartInstances = useRef({});
  const chartRefs = useRef({});
  const healthScoreRef = useRef(null);
  const issueDistributionRef = useRef(null);
  const chromeUXMobileRef = useRef(null);
  const chromeUXDesktopRef = useRef(null);

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

  const handleStartAudit = async () => {
    setLoadingAudit(true);
    setAuditResults(null);

    try {
      const response = await axios.post('/api/audit/create', { domain: newDomain });
      const auditId = response.data.id;

      const newAudit = {
        id: auditId,
        title: `${newDomain}_${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`,
        status: 'pending'
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
          setPollingInterval(null);
          fetchAuditReport(auditId);
        }
      } catch (error) {
        console.error('Error checking audit status:', error);
      }
    }, 5000); // Poll every 5 seconds
    setPollingInterval(interval);
  };

  const fetchAuditReport = async (auditId) => {
    try {
      const reportResponse = await axios.get(`/api/audit/${auditId}/report`);
      setAuditResults(reportResponse.data);
      setLoadingAudit(false);
      setAudits((prevAudits) => prevAudits.map((audit) =>
        audit.id === auditId ? { ...audit, status: 'finished' } : audit
      ));
    } catch (error) {
      console.error('Error fetching audit report:', error);
    }
  };

  const handleAuditClick = (auditId) => {
    setCurrentAudit(auditId);
    fetchAuditReport(auditId);
  };

  useEffect(() => {
    if (auditResults) {
      // Render Health Score chart
      renderHealthScoreChart();

      // Render Issue Distribution chart
      renderIssueDistributionChart();

      // Render ChromeUX charts
      renderChromeUXCharts();

      // Render charts or tables for each section
      auditResults.sections.forEach((section) => {
        const sectionProps = section.props;
        if (sectionProps) {
          const labels = Object.values(sectionProps).map((prop) => prop.name);
          const data = Object.values(sectionProps).map((prop) => prop.value);

          if (['content_v2', 'links_v2', 'other_v2'].includes(section.uid)) {
            // Render table
            renderIssueTable(section);
          } else {
            // Render charts
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

  const renderHealthScoreChart = () => {
    if (healthScoreRef.current) {
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
    if (issueDistributionRef.current) {
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

  const renderIssueTable = (section) => {
    // This function will render tables for content_v2, links_v2, other_v2
    // Tables are rendered in the JSX below
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
    if (chromeUXMobileRef.current && auditResults.chromeux.mobile) {
      const ctx = chromeUXMobileRef.current.getContext('2d');
      const mobileData = auditResults.chromeux.mobile;
      renderChromeUXChart(ctx, mobileData, 'ChromeUX Mobile');
    }

    // Render ChromeUX Desktop
    if (chromeUXDesktopRef.current && auditResults.chromeux.desktop) {
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
        // If data is missing, push zeros or skip
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
      'rgba(255, 102, 255, 0.6)'
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
        <h1>Site Audit Tool</h1>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter domain"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <button onClick={handleStartAudit} disabled={loadingAudit}>
            {loadingAudit ? 'Starting...' : 'Start Audit'}
          </button>
        </div>
  
        {loadingAudit && <div className={styles.loading}>Running Audit...</div>}
  
        {auditResults && (
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
      </div>
    </div>
  );
  
}