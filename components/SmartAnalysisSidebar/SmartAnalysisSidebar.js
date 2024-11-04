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
                              <th>Entity / Type</th>
                              <th>Count</th>

                              <th>Item Count / Frequency</th>
                              <th>Header Count / Frequency</th>
                              <th>Title Count</th>

                            </tr>
                          </thead>
                          <tbody>
                            {cluster.cluster_entities
                              .sort((a, b) => b.count - a.count)
                              .map((entity, idx) => (
                                <tr key={idx}>
                                  <td><strong>{entity.entity}</strong><small><br/>{entity.type}<br/><i>{entity.pos}</i></small></td>
                                  <td>{entity.count}</td>

                                  <td>{entity.item_count} / {entity.frequency}</td>
                                  <td>{entity.header_count} / {entity.header_frequency}</td>
                                  <td>{entity.title_count} </td>

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
              <th>URL & Properties</th>
              <th>Word Count</th>
              <th>Headers</th> 
              <th>Images</th> {/* New column for Images */}
              <th>Questions</th> {/* New column for Questions */}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const headerSummary = {};
              
              // Count headers by type (H1, H2, etc.)
              item.assets.forEach((asset) => {
                const tag = asset.header_tag.toUpperCase();
                headerSummary[tag] = (headerSummary[tag] || 0) + 1;
              });

              const summaryText = Object.entries(headerSummary)
                .map(([tag, count]) => `${count} ${tag}`)
                .join(', ');

              const [expanded, setExpanded] = useState({});
              const [imagesExpanded, setImagesExpanded] = useState({});
              const [questionsExpanded, setQuestionsExpanded] = useState({});

              const toggleExpand = () => {
                setExpanded((prevExpanded) => ({
                  ...prevExpanded,
                  [idx]: !prevExpanded[idx],
                }));
              };

              const toggleImages = () => {
                setImagesExpanded((prevImagesExpanded) => ({
                  ...prevImagesExpanded,
                  [idx]: !prevImagesExpanded[idx],
                }));
              };

              const toggleQuestions = () => {
                setQuestionsExpanded((prevQuestionsExpanded) => ({
                  ...prevQuestionsExpanded,
                  [idx]: !prevQuestionsExpanded[idx],
                }));
              };

              return (
                <tr key={idx}>
                  {/* URL and Properties with Icons */}
                  <td>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.url}
                    </a>
                    <div>{item.title}</div>
                    <div>{item.description}</div>
                    <div className={styles.iconsContainer}>
                      {/* Properties Icons */}
                      {Object.entries(item.properties).map(([key, value]) => {
                        // Define icon based on property name
                        let iconClass = '';
                        switch (key) {
                          case 'how_to':
                            iconClass = 'fa-question-circle'; // Example icon for how_to
                            break;
                          case 'listicle':
                            iconClass = 'fa-list'; // Example icon for listicle
                            break;
                          case 'long_form':
                            iconClass = 'fa-file-alt'; // Example icon for long form
                            break;
                          case 'product':
                            iconClass = 'fa-box'; // Example icon for product
                            break;
                          case 'review':
                            iconClass = 'fa-star'; // Example icon for review
                            break;
                          case 'short_form':
                            iconClass = 'fa-file'; // Example icon for short form
                            break;
                          case 'visual':
                            iconClass = 'fa-image'; // Example icon for visual
                            break;
                          default:
                            iconClass = 'fa-circle'; // Default icon
                        }

                        return (
                          <i
                            key={key}
                            className={`fas ${iconClass}`}
                            style={{ color: value ? 'black' : '#ababab', margin: '0 5px' }}
                            title={`This page ${value ? 'has' : 'does not have'} ${key} in search results`}
                          />
                        );
                      })}
                      
                      {/* Statistics Icon */}
                      {item.statistics && (
                        <i
                          className="fas fa-chart-bar"
                          style={{ color: 'black', marginLeft: '5px' }}
                          title={`Statistics: ${JSON.stringify(item.statistics)}`}
                        />
                      )}
                    </div>
                  </td>
                  
                  {/* Word Count */}
                  <td>{item.word_count}</td>
                  
                  {/* Headers Summary with Expand/Collapse */}
                  <td>
                    <div>{summaryText}</div> 
                    <button onClick={() => toggleExpand(idx)}>
                      {expanded[idx] ? 'Collapse' : 'Expand'}
                    </button>
                    {expanded[idx] && (
                      <div className={styles.expandedHeaders}>
                        {item.assets.map((asset, headerIdx) => (
                          <div key={headerIdx}>
                            <strong>{asset.header_tag.toUpperCase()}:</strong> {asset.header}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Images with Count and Expand/Collapse */}
                  <td>
                    <div>{item.images ? item.images.length : 0}</div>
                    {item.images && item.images.length > 0 && (
                      <>
                        <button onClick={toggleImages}>
                          {imagesExpanded[idx] ? 'Collapse' : 'View Images'}
                        </button>
                        {imagesExpanded[idx] && (
                          <div className={styles.expandedImages}>
                            {item.images.map((image, imageIdx) => (
                              <div key={imageIdx}>
                                <img src={image} alt={`Image ${imageIdx}`} width="100" />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  {/* Questions with Count and Expand/Collapse */}
                  <td>
                    <div>{item.questions ? item.questions.length : 0}</div>
                    {item.questions && item.questions.length > 0 && (
                      <>
                        <button onClick={toggleQuestions}>
                          {questionsExpanded[idx] ? 'Collapse' : 'View Questions'}
                        </button>
                        {questionsExpanded[idx] && (
                          <div className={styles.expandedQuestions}>
                            {item.questions.map((question, questionIdx) => (
                              <div key={questionIdx}>
                                <p>{question}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>



    </div>
  );
};

export default SmartAnalysisSidebar;
