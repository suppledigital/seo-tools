// components/content/SemrushData.js

import React from 'react';
import styles from './SemrushData.module.css';

const SemrushData = ({
  sidebarContent,
  loadingSemrushData,
  selectedRelatedKeywords,
  setSelectedRelatedKeywords,
  selectedBroadMatchKeywords,
  setSelectedBroadMatchKeywords,
  selectedPhraseQuestions,
  setSelectedPhraseQuestions,
  handlers,
  sidebarExpanded
}) => {
  const { handleCheckboxChange, handleSetAs, handleSetAllAs } = handlers;

  return loadingSemrushData ? (
    <div>Loading Keywords data...</div>
  ) : (
    !loadingSemrushData &&
    sidebarContent &&
    sidebarContent.semrushData && (
      <div className={styles.keywordTablesContainer}>
        <div
          className={`${styles.keywordTablesGrid} ${
            sidebarExpanded ? styles.expandedGrid : ''
          }`}
        >
          {/* Related Keywords */}
          <KeywordTable
            title="Related Keywords"
            data={sidebarContent.semrushData.relatedKeywords}
            selectedKeywords={selectedRelatedKeywords}
            setSelectedKeywords={setSelectedRelatedKeywords}
            handleCheckboxChange={(keyword, isChecked) =>
              handleCheckboxChange('related', keyword, isChecked)
            }
            handleSetAs={() => handleSetAs('related', 'LSI', selectedRelatedKeywords)}
            handleSetAllAs={() => handleSetAllAs('related', 'LSI')}
          />
          {/* Broad Match Keywords */}
          <KeywordTable
            title="Broad Match Keywords"
            data={sidebarContent.semrushData.broadMatchKeywords}
            selectedKeywords={selectedBroadMatchKeywords}
            setSelectedKeywords={setSelectedBroadMatchKeywords}
            handleCheckboxChange={(keyword, isChecked) =>
              handleCheckboxChange('broad', keyword, isChecked)
            }
            handleSetAs={() => handleSetAs('broad', 'LSI', selectedBroadMatchKeywords)}
            handleSetAllAs={() => handleSetAllAs('broad', 'LSI')}
          />
          {/* Phrase Questions */}
          <KeywordTable
            title="Phrase Questions"
            data={sidebarContent.semrushData.phraseQuestions}
            selectedKeywords={selectedPhraseQuestions}
            setSelectedKeywords={setSelectedPhraseQuestions}
            handleCheckboxChange={(keyword, isChecked) =>
              handleCheckboxChange('phrase', keyword, isChecked)
            }
            handleSetAs={() => handleSetAs('phrase', 'PAA', selectedPhraseQuestions)}
            handleSetAllAs={() => handleSetAllAs('phrase', 'PAA')}
          />
        </div>
      </div>
    )
  );
};

const KeywordTable = ({
  title,
  data,
  selectedKeywords,
  setSelectedKeywords,
  handleCheckboxChange,
  handleSetAs,
  handleSetAllAs,
}) => {
  return (
    <div className={styles.keywordTable}>
      <h3 style={{ display: 'flex' }}>
        <span>{title}</span>
        <img
          src="/assets/semrush_rect.png"
          alt="SEMrush Logo"
          style={{ width: '100px', height: 'auto' }}
        />
      </h3>
      {data.length === 0 ? (
        <div>No Data Found</div>
      ) : (
        <>
          <div className={styles.scrollable}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Keyword</th>
                  <th>Volume</th>
                  <th>CPC</th>
                  <th>Competition</th>
                  <th>KD%</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedKeywords.includes(item.keyword)}
                        onChange={(e) =>
                          handleCheckboxChange(item.keyword, e.target.checked)
                        }
                      />
                    </td>
                    <td>{item.keyword}</td>
                    <td>{item.volume}</td>
                    <td>{item.cpc}</td>
                    <td>{item.competition}</td>
                    <td>{item.kd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.buttonContainer}>
            <button onClick={handleSetAs}>Set Selected as LSI</button>
            <button onClick={handleSetAllAs}>Set All as LSI</button>
          </div>
        </>
      )}
    </div>
  );
};

export default SemrushData;
