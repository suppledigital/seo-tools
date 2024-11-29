// components/content/KeywordAnalysis.js

import React from 'react';
import styles from './KeywordAnalysis.module.css';
import { Bar } from 'react-chartjs-2';

// Import and register Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import { CircularProgressbar } from 'react-circular-progressbar';
import SemrushData from './SemrushData';
import SerpResults from './SerpResults';


const KeywordAnalysis = ({
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
  selectedKeyword,
  selectedCountry,
  handlers,
  sidebarExpanded
}) => {
  return (
    <>
      {loadingAnalyzeKeyword ? (
        <div>Loading keyword analysis...</div>
      ) : (
        sidebarContent && sidebarContent.keywordData && (
          <div className={styles.keywordAnalysis}>
            <h3>Keyword Analysis</h3>
            <div className={styles.analysisGrid}>
              {/* Difficulty Chart */}
              <div className={styles.difficultyBlock}>
                <div className={styles.blockHeader}>
                  <span>Difficulty</span>
                  <img
                    src="/assets/seranking.svg"
                    alt="SE Ranking Logo"
                    style={{ width: '60px', height: 'auto', marginLeft: '5px' }}
                  />
                </div>
                <div className={styles.blockContent}>
                  <CircularProgressbar
                    value={sidebarContent.keywordData.difficulty}
                    text={`${sidebarContent.keywordData.difficulty}%`}
                    styles={{
                      path: { stroke: '#0070f3' },
                      text: { fill: '#000' },
                      trail: { stroke: '#d6d6d6' },
                      background: { fill: '#fff' },
                    }}
                  />
                </div>
              </div>
              {/* Trend Chart */}
              {sidebarContent.keywordData.history_trend ? (
                <div className={styles.trendBlock}>
                  <div className={styles.blockHeader}>
                    <span>Trend</span>
                    <img
                      src="/assets/seranking.svg"
                      alt="SE Ranking Logo"
                      style={{ width: '60px', height: 'auto', marginLeft: '5px' }}
                    />
                  </div>
                  <div className={styles.blockContent}>
                    <Bar
                      data={{
                        labels: Object.keys(sidebarContent.keywordData.history_trend),
                        datasets: [
                          {
                            label: 'Search Volume',
                            data: Object.values(sidebarContent.keywordData.history_trend),
                            backgroundColor: '#0070f3',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              display: false,
                            },
                            grid: {
                              display: false,
                            },
                          },
                          y: {
                            ticks: {
                              display: false,
                            },
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.trendBlock}>
                  <div className={styles.blockHeader}>
                    <span>Trend</span>
                    <img
                      src="/assets/seranking.svg"
                      alt="SE Ranking Logo"
                      style={{ width: '60px', height: 'auto', marginLeft: '5px' }}
                    />
                  </div>
                  <div className={styles.blockContent}>
                    <div>No trend data available.</div>
                  </div>
                </div>
              )}
              {/* Volume */}
              <div className={styles.volumeBlock}>
                <div className={styles.blockHeader}>
                  <span>Volume</span>
                  <img
                    src="/assets/seranking.svg"
                    alt="SE Ranking Logo"
                    style={{ width: '60px', height: 'auto', marginLeft: '5px' }}
                  />
                </div>
                <div className={styles.blockContent}>
                  <span className={styles.volumeValue}>{sidebarContent.keywordData.volume}</span>
                </div>
              </div>
              {/* CPC and Competition */}
              <div className={styles.cpcBlock}>
                <div className={styles.blockHeader}>
                  <span>CPC</span>
                  <img
                    src="/assets/seranking.svg"
                    alt="SE Ranking Logo"
                    style={{ width: '60px', height: 'auto', marginLeft: '5px' }}
                  />
                </div>
                <div className={styles.blockContent}>
                  <span className={styles.cpcValue}>${sidebarContent.keywordData.cpc}</span>
                </div>
              </div>
              <div className={styles.competitionBlock}>
                <div className={styles.blockHeader}>
                  <span>Competition</span>
                  <img
                    src="/assets/seranking.svg"
                    alt="SE Ranking Logo"
                    style={{ width: '60px', height: 'auto', marginLeft: '5px' }}
                  />
                </div>
                <div className={styles.blockContent}>
                  <span className={styles.competitionValue}>
                    {sidebarContent.keywordData.competition}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}
      {/* Semrush Data */}
      <SemrushData
        sidebarContent={sidebarContent}
        loadingSemrushData={loadingSemrushData}
        selectedRelatedKeywords={selectedRelatedKeywords}
        setSelectedRelatedKeywords={setSelectedRelatedKeywords}
        selectedBroadMatchKeywords={selectedBroadMatchKeywords}
        setSelectedBroadMatchKeywords={setSelectedBroadMatchKeywords}
        selectedPhraseQuestions={selectedPhraseQuestions}
        setSelectedPhraseQuestions={setSelectedPhraseQuestions}
        handlers={handlers}
        sidebarExpanded={sidebarExpanded} // Pass the prop here

      />
      {/* SERP Results */}
      <SerpResults
        sidebarContent={sidebarContent}
        loadingSerpResults={loadingSerpResults}
        serpResultsLimit={serpResultsLimit}
        setSerpResultsLimit={setSerpResultsLimit}
        serpResultsExpanded={serpResultsExpanded}
        setSerpResultsExpanded={setSerpResultsExpanded}
        handlers={handlers}
        selectedKeyword={selectedKeyword}
        selectedCountry={selectedCountry}
        sidebarExpanded={sidebarExpanded} // Pass the prop here
      />
    </>
  );
};

export default KeywordAnalysis;
