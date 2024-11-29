// components/content/Sidebar.js

import React from 'react';
import styles from './Sidebar.module.css';
import KeywordAnalysis from './KeywordAnalysis';
import SmartAnalysisSidebar from '../SmartAnalysisSidebar/SmartAnalysisSidebar';

const Sidebar = ({
  sidebarRef,
  sidebarExpanded,
  setSidebarExpanded,
  keywordInput,
  setKeywordInput,
  setSelectedCountry,
  sidebarType,
  sidebarContent,
  loadingAnalyzeKeyword,
  loadingSemrushData,
  loadingSerpResults,
  selectedRelatedKeywords,
  setSelectedRelatedKeywords,
  selectedBroadMatchKeywords,
  setSelectedBroadMatchKeywords,
  selectedPhraseQuestions,
  setSelectedPhraseQuestions,
  serpResultsLimit,
  setSerpResultsLimit,
  serpResultsExpanded,
  setSerpResultsExpanded,
  loadingAnalysisResults,
  currentEntryId,
  selectedKeyword,
  selectedCountry,
  handlers,
}) => {
  const {
    handleKeywordSearch,
    fetchKeywordAnalysis,
    fetchSemrushData,
    fetchSerpResults,
    setLoadingAnalyzeKeyword,
    setLoadingSerpResults,
    setLoadingSemrushData,
    setSidebarType,
    handleSmartAnalysis,
  } = handlers;

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebar} ${sidebarExpanded ? styles.sidebarExpanded : ''}`}
    >
      <i
        className={`fas ${sidebarExpanded ? 'fa-arrow-right' : 'fa-arrow-left'} ${
          styles.sidebarToggleIcon
        }`}
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
      ></i>
      <div className={styles.sidebarHeader}>
        {/* Keyword Input and Controls */}
        <div className={styles.keywordInputContainer}>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleKeywordSearch();
              }
            }}
            placeholder="Enter keyword"
          />
          <i className="fas fa-paper-plane" onClick={handleKeywordSearch}></i>
        </div>
        <br />
        <select
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            // Re-fetch data with the new country
            setLoadingAnalyzeKeyword(true);
            setLoadingSerpResults(true);
            setLoadingSemrushData(true);
            if (sidebarType === 'keyword') {
              fetchKeywordAnalysis(selectedKeyword, e.target.value);
              fetchSerpResults(selectedKeyword, e.target.value);
              fetchSemrushData(selectedKeyword, e.target.value);
            } else if (sidebarType === 'smartAnalysis') {
              handleSmartAnalysis(null, selectedKeyword, currentEntryId);
            }
          }}
        >
          <option value="AU">Australia</option>
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="NZ">New Zealand</option>
          {/* Add more countries as needed */}
        </select>
      </div>
      <div className={styles.sidebarContent}>
        {sidebarType === 'keyword' && sidebarContent && (
           <KeywordAnalysis
           sidebarContent={sidebarContent}
           loadingAnalyzeKeyword={loadingAnalyzeKeyword}
           loadingSemrushData={loadingSemrushData}
           loadingSerpResults={loadingSerpResults}
           selectedRelatedKeywords={selectedRelatedKeywords}
           setSelectedRelatedKeywords={setSelectedRelatedKeywords}
           selectedBroadMatchKeywords={selectedBroadMatchKeywords}
           setSelectedBroadMatchKeywords={setSelectedBroadMatchKeywords}
           selectedPhraseQuestions={selectedPhraseQuestions}
           setSelectedPhraseQuestions={setSelectedPhraseQuestions}
           serpResultsLimit={serpResultsLimit}
           setSerpResultsLimit={setSerpResultsLimit}
           serpResultsExpanded={serpResultsExpanded}
           setSerpResultsExpanded={setSerpResultsExpanded}
           handlers={handlers}
           selectedKeyword={selectedKeyword}
           selectedCountry={selectedCountry}
           sidebarExpanded={sidebarExpanded}
           />
        )}
        {loadingAnalysisResults ? (
          <div>Loading SERP Analysis...</div>
        ) : (
          !loadingAnalysisResults &&
          sidebarType === 'smartAnalysis' &&
          sidebarContent && (
            <SmartAnalysisSidebar smartAnalysisData={sidebarContent.smartAnalysisData} />
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
