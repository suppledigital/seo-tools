// components/audit/site-audit/SiteAudit.js
import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './SiteAudit.module.css';
import SortableTable from '../../common/SortableTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';


// Dynamically import Highcharts to prevent SSR issues
const Highcharts = dynamic(() => import('highcharts'), { ssr: false });
const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });

const SiteAudit = ({
  auditResults,
  renderHealthScoreChart,
  renderIssueDistributionChart,
  renderChromeUXCharts,
  renderSectionChart,
  chartRefs,
}) => {
  const healthScoreRef = useRef(null);
  const issueDistributionRef = useRef(null);
  const chromeUXMobileRef = useRef(null);
  const chromeUXDesktopRef = useRef(null);

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
            // Tables are rendered here
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

  // Define columns for any tables if needed
  // For example:
  /*
  const someTableColumns = [
    { Header: 'Issue', accessor: 'issue' },
    { Header: 'Count', accessor: 'count' },
    // Add more columns as needed
  ];
  */

  return (
    <div className={styles.siteAudit}>
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
    </div>
  );
};

export default SiteAudit;
