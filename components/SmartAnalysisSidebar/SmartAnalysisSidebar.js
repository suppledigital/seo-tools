// components/SmartAnalysisSidebar/SmartAnalysisSidebar.js

import React, { useState } from 'react';
import styles from './SmartAnalysisSidebar.module.css';
import { Bar } from 'react-chartjs-2';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const SmartAnalysisSidebar = ({ smartAnalysisData }) => {
  const [expandedClusters, setExpandedClusters] = useState({});

  const toggleCluster = (index) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  if (!smartAnalysisData) {
    return null;
  }

  const { aggregate_metrics, cluster_info, items } = smartAnalysisData;

  return (
    <div className={styles.sidebarContainer}>
      {/* Aggregate Metrics */}
      <div className={styles.aggregateMetrics}>
        <div className={styles.metricBlock}>
          <h4>Avg External Links</h4>
          <p>{aggregate_metrics.avg_external_links}</p>
        </div>
        <div className={styles.metricBlock}>
          <h4>Avg Headers</h4>
          <p>{aggregate_metrics.avg_headers}</p>
        </div>
        <div className={styles.metricBlock}>
          <h4>Avg Word Count</h4>
          <p>{aggregate_metrics.avg_word_count}</p>
        </div>
      </div>

      {/* Cluster Info */}
      <div className={styles.clusterInfo}>
        <h3>Cluster Information</h3>
        <table className={styles.clusterTable}>
          <thead>
            <tr>
              <th>Count</th>
              <th>Label</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cluster_info
              .sort((a, b) => b.count - a.count)
              .map((cluster, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td>{cluster.count}</td>
                    <td>{cluster.label}</td>
                    <td>
                      <button onClick={() => toggleCluster(index)}>
                        {expandedClusters[index] ? 'Collapse' : 'Expand'}
                      </button>
                    </td>
                  </tr>
                  {expandedClusters[index] && (
                    <tr>
                      <td className={styles.innerTable} colSpan="3">
                        <table className={styles.clusterEntitiesTable}>
                          <thead>
                            <tr>
                              <th>Count</th>
                              <th>Entity</th>
                              <th>Item Count / Frequency</th>
                              <th>Header Count / Frequency</th>

                              <th>Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cluster.cluster_entities
                              .sort((a, b) => b.count - a.count)
                              .map((entity, idx) => (
                                <tr key={idx}>
                                  <td>{entity.count}</td>
                                  <td>{entity.entity}</td>
                                  <td>{entity.item_count} / {entity.frequency}</td>
                                  <td>{entity.header_count} / {entity.header_frequency}</td>

                                  <td>{entity.type}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>

      {/* Items (Search Results) */}
      <div className={styles.searchResults}>
        <h3>Search Results</h3>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>URL</th>
              <th>Word Count</th>
              <th>Language</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url}
                    
                  </a>
                  <div>{item.title}</div>
                  <div>{item.description}</div>
                </td>
              
                <td>{item.word_count}</td>
                <td>{item.language}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SmartAnalysisSidebar;
