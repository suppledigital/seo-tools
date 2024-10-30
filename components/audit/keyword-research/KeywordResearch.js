// components/audit/keyword-research/KeywordResearch.js
import React from 'react';
import styles from './KeywordResearch.module.css';
import SortableTable from '../../common/SortableTable';

const KeywordResearch = ({ keywordData }) => {
  // Define columns for Keyword Research Table
  const keywordColumns = [
    {
      Header: 'Keyword',
      accessor: 'keyword',
    },
    {
      Header: 'Search Volume',
      accessor: 'search_volume',
    },
    {
      Header: 'Competition',
      accessor: 'competition',
    },
    {
      Header: 'CPC',
      accessor: 'cpc',
      Cell: ({ value }) => `$${value.toFixed(2)}`,
    },
    // Add more columns as needed
  ];

  return (
    <div className={styles.keywordResearch}>
      <h2>Keyword Research Results</h2>
      {keywordData && keywordData.length > 0 ? (
        <SortableTable columns={keywordColumns} data={keywordData} />
      ) : (
        <p>No keyword research data available.</p>
      )}
    </div>
  );
};

export default KeywordResearch;
