// components/content/SerpResults.js

import React, { useState } from 'react';
import styles from './SerpResults.module.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { serpFeatures } from '../../utils/serpFeatures';
import { fontAwesomeIconsMap } from '../../utils/serpFeatureIconsMap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SerpResults = ({
  sidebarContent,
  loadingSerpResults,
  serpResultsLimit,
  setSerpResultsLimit,
  serpResultsExpanded,
  setSerpResultsExpanded,
  handlers,
  selectedKeyword,
  selectedCountry,
}) => {
  const { fetchSerpResults, setLoadingSerpResults } = handlers;

  const [yearMonthInput, setYearMonthInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleRefreshSerpResults = () => {
    let yearMonthInput = '';
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      yearMonthInput = `${year}${month}`;
    }

    // Fetch SERP results with the new date
    fetchSerpResults(selectedKeyword, selectedCountry, yearMonthInput);
  };


  return loadingSerpResults ? (
    <div>Loading SERP results...</div>
  ) : (
    !loadingSerpResults &&
    sidebarContent &&
    sidebarContent.serpResults && (
      <div className={styles.serpResultsContainer}>
        <h3>SERP Results</h3>
        {/* Date Input Field */}
        <div className={styles.dateInputContainer}>
          <label htmlFor="yearMonth">Year-Month (YYYYMM):</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyyMM"
            showMonthYearPicker
            placeholderText="Select month and year"
          />
          <button onClick={handleRefreshSerpResults}>Refresh</button>
        </div>
        <div
          className={`${styles.serpResults} ${
            serpResultsExpanded ? styles.serpResultsExpanded : ''
          }`}
        >
          <table className={styles.serpTable}>
            <thead>
            <tr><th>Position</th>
            <th>Domain / URL</th>
            <th>SERP Features</th>
            </tr>
              </thead>
            <tbody>
              {sidebarContent.serpResults.slice(0, serpResultsLimit).map((result, index) => {
                // Parse the SERP features codes
                const keywordsSerpFeaturesCodes =
                  result['Keywords SERP Features'] || result['Keywords SERP Features\r'] || '';
                const serpFeaturesCodes =
                  result['SERP Features'] || result['SERP Features\r'] || '';

                // Convert codes to arrays
                const keywordsSerpFeaturesArray = keywordsSerpFeaturesCodes
                  .replace('\r', '')
                  .split(',')
                  .map((code) => code.trim())
                  .filter((code) => code !== '');
                const serpFeaturesArray = serpFeaturesCodes
                  .replace('\r', '')
                  .split(',')
                  .map((code) => code.trim())
                  .filter((code) => code !== '');

                return (
                  <tr key={index}>
                    {/* Position Column */}
                    <td className={styles.positionCell}>{result.Position}</td>
                    {/* Domain and URL Column */}
                    <td className={styles.resultInfoCell}>
                      <div className={styles.domainRow}>{result.Domain}</div>
                      <div className={styles.urlRow}>
                        <a href={result.Url} target="_blank" rel="noopener noreferrer">
                          {result.Url}
                        </a>
                      </div>
                    </td>
                    {/* SERP Features Column */}
                    <td className={styles.featuresCell}>
                      {keywordsSerpFeaturesArray.map((code) => {
                        const feature = serpFeatures[code];
                        if (!feature) return null; // Skip if feature not found
                        const iconName = feature.icon;
                        const IconComponent = fontAwesomeIconsMap[iconName];
                        if (!IconComponent) return null; // Skip if icon is not defined

                        const isActive = serpFeaturesArray.includes(code);

                        return (
                          <div
                            key={code}
                            className={styles.iconWrapper}
                            title={`${feature.name}: ${feature.description}`}
                          >
                            <FontAwesomeIcon
                              icon={IconComponent}
                              style={{
                                color: isActive ? '#000' : '#ccc',
                                cursor: 'default',
                                margin: '0 5px',
                              }}
                            />
                          </div>
                        );
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sidebarContent.serpResults.length > 20 && !serpResultsExpanded && (
          <button
            className={styles.showMoreButton}
            onClick={() => {
              setSerpResultsLimit(sidebarContent.serpResults.length);
              setSerpResultsExpanded(true);
            }}
          >
            Show More
          </button>
        )}
      </div>
    )
  );
};

export default SerpResults;
