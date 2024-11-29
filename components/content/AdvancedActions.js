// components/content/AdvancedActions.js

import React, { useState } from 'react';
import styles from './AdvancedActions.module.css';
import axios from 'axios';

export default function AdvancedActions({
  entries,
  selectedEntries,
  setSelectedEntries,
  applyBulkAction,
}) {
  const [expanded, setExpanded] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [bulkActionField, setBulkActionField] = useState('');
  const [pageTypeValue, setPageTypeValue] = useState('');
  const [contentTypeValue, setContentTypeValue] = useState('');
  const [additionalInfoType, setAdditionalInfoType] = useState('');
  const [additionalInfoValue, setAdditionalInfoValue] = useState('');
  const [showBulkActionOptions, setShowBulkActionOptions] = useState(false);

  // Additional state variables
  const [showGenerateIdeas, setShowGenerateIdeas] = useState(false);
  const [keywordForIdeas, setKeywordForIdeas] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [overrideExisting, setOverrideExisting] = useState(true);
  const allInfoItems = [
    { key: 'word_count', label: 'Word Count' },
    { key: 'lsi_terms', label: 'LSI Terms' },
    { key: 'paa_terms', label: 'PAA Terms' },
    { key: 'topic_cluster', label: 'Topic Cluster' },
    { key: 'existing_content', label: 'Existing Content' },
    { key: 'existing_product_info', label: 'Existing Product Info' },
    { key: 'brand_terms', label: 'Brand Terms' },
  ];

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleSelectAll = () => {
    setSelectedEntries(entries.map((entry) => entry.entry_id));
  };

  const handleDeselectAll = () => {
    setSelectedEntries([]);
  };

  const handleSelectByPageType = (pageType) => {
    setSelectedEntries(
      entries.filter((entry) => entry.page_type === pageType).map((entry) => entry.entry_id)
    );
  };

  const handleSelectByContentType = (contentType) => {
    setSelectedEntries(
      entries.filter((entry) => entry.content_type === contentType).map((entry) => entry.entry_id)
    );
  };

  const handleBulkModify = () => {
    if (selectedEntries.length === 0) {
      alert('Please select entries to modify.');
      return;
    }
    setBulkActionType('modify');
    setShowBulkActionOptions(true);
  };

  const handleBulkReset = () => {
    if (selectedEntries.length === 0) {
      alert('Please select entries to reset.');
      return;
    }
    setBulkActionType('reset');
    setShowBulkActionOptions(true);
  };

 
  const handleGetIdeas = async () => {
    try {
      let response;
      if (additionalInfoType === 'paa_terms') {
        response = await axios.post('/api/content/semrush/paa-suggestions', {
          keyword: keywordForIdeas,
          country: 'AU',
        });
        setSuggestions([
          ...response.data.relatedKeywords.map((kw) => ({ ...kw, source: 'Related' })),
          ...response.data.broadMatchKeywords.map((kw) => ({ ...kw, source: 'Broad' })),
        ]);
      } else if (additionalInfoType === 'lsi_terms') {
        response = await axios.post('/api/content/semrush/lsi-suggestions', {
          keyword: keywordForIdeas,
          country: 'AU',
        });
        setSuggestions(
          response.data.phraseQuestions.map((kw) => ({ ...kw, source: 'Question' }))
        );
      }
      // Handle topic_cluster similarly
    } catch (error) {
      console.error('Error fetching ideas:', error);
      alert('Error fetching ideas.');
    }
  };

  const handleApplyBulkAction = () => {
    let actionValue = null;

    if (bulkActionField === 'page_type') {
      actionValue = pageTypeValue;
    } else if (bulkActionField === 'content_type') {
      actionValue = contentTypeValue;
    } else if (bulkActionField === 'additional_info') {
      if (['lsi_terms', 'paa_terms', 'topic_cluster'].includes(additionalInfoType)) {
        actionValue = {
          [additionalInfoType]: {
            suggestions: selectedSuggestions,
            overrideExisting: overrideExisting,
          },
        };
      } else {
        actionValue = { [additionalInfoType]: additionalInfoValue };
      }
    }

    applyBulkAction(bulkActionType, bulkActionField, actionValue);

    // Reset state
    setShowBulkActionOptions(false);
    setBulkActionField('');
    setPageTypeValue('');
    setContentTypeValue('');
    setAdditionalInfoType('');
    setAdditionalInfoValue('');
    setSelectedSuggestions([]);
    setSuggestions([]);
    setShowGenerateIdeas(false);
    setKeywordForIdeas('');
  };


  return (
    <div className={styles.advancedActions}>
      <div className={styles.header}>
        <span>{selectedEntries.length} entries selected</span>
        <button className={styles.expandButton} onClick={handleExpandClick}>
          {expanded ? 'Hide Advanced Actions' : 'Show Advanced Actions'}
        </button>
      </div>
      {expanded && (
        <div className={styles.actionsContainer}>
          <div className={styles.selectionActions}>
            <div className={styles.individualSelectContainer}>
              <span>Select by:</span>
              <select onChange={(e) => handleSelectByPageType(e.target.value)}>
                <option value="">--Select Page Type--</option>
                {[
                  'Home Page',
                  'Service Page',
                  'Location Page',
                  'Product Page',
                  'Product Category Page',
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select onChange={(e) => handleSelectByContentType(e.target.value)}>
                <option value="">--Select Content Type--</option>
                {['New Content', 'Additional Content', 'Rewrite Content'].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.selectAllContainer}>
              <span>or you can also</span>
              <a href="#" onClick={handleSelectAll}>
                Select All
              </a>
              <a href="#" onClick={handleDeselectAll}>
                Deselect All
              </a>
            </div>
            <div className={styles.bulkActions}>
                <button onClick={handleBulkModify}>Modify</button>
                <button className={styles.resetBtn}onClick={handleBulkReset}>Reset</button>
            </div>
          </div>
          

          {showBulkActionOptions && (
            <div className={styles.bulkActionOptions}>
              <h3>{bulkActionType === 'modify' ? 'Bulk Modify' : 'Bulk Reset'}</h3>
              <div>
                <label>Select a field to {bulkActionType}:</label>
                <select
                  value={bulkActionField}
                  onChange={(e) => {
                    setBulkActionField(e.target.value);
                    // Reset related values when changing the field
                    setPageTypeValue('');
                    setContentTypeValue('');
                    setAdditionalInfoType('');
                    setAdditionalInfoValue('');
                    setSelectedSuggestions([]);
                    setSuggestions([]);
                    setShowGenerateIdeas(false);
                    setKeywordForIdeas('');
                  }}
                >
                  <option value="">Select Field</option>
                  <option value="page_type">Page Type</option>
                  <option value="content_type">Content Type</option>
                  <option value="additional_info">Additional Info</option>
                </select>
              </div>

              {/* For Page Type */}
              {bulkActionField === 'page_type' && bulkActionType === 'modify' && (
                <div>
                  <label>New Page Type:</label>
                  <select
                    value={pageTypeValue}
                    onChange={(e) => setPageTypeValue(e.target.value)}
                  >
                    <option value="">Select Page Type</option>
                    {[
                      'Home Page',
                      'Service Page',
                      'Location Page',
                      'Product Page',
                      'Product Category Page',
                    ].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* For Content Type */}
              {bulkActionField === 'content_type' && bulkActionType === 'modify' && (
                <div>
                  <label>New Content Type:</label>
                  <select
                    value={contentTypeValue}
                    onChange={(e) => setContentTypeValue(e.target.value)}
                  >
                    <option value="">Select Content Type</option>
                    {['New Content', 'Additional Content', 'Rewrite Content'].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* For Additional Info */}
              {bulkActionField === 'additional_info' && (
                <div>
                  <label>Additional Info Type:</label>
                  <select
                    value={additionalInfoType}
                    onChange={(e) => {
                      setAdditionalInfoType(e.target.value);
                      setAdditionalInfoValue('');
                      setSelectedSuggestions([]);
                      setSuggestions([]);
                      setShowGenerateIdeas(false);
                      setKeywordForIdeas('');
                    }}
                  >
                    <option value="">Select Info Type</option>
                    {allInfoItems.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {/* Word Count Input and Slider */}
                  {additionalInfoType === 'word_count' && (
                    <div>
                      <label>Word Count:</label>
                      <input
                        type="number"
                        value={additionalInfoValue}
                        onChange={(e) => setAdditionalInfoValue(e.target.value)}
                        min="0"
                        max="5000"
                        step="50"
                      />
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        value={additionalInfoValue || 0}
                        onChange={(e) => setAdditionalInfoValue(e.target.value)}
                      />
                    </div>
                  )}

                  {/* PAA, LSI, Topic Cluster */}
                  {['lsi_terms', 'paa_terms', 'topic_cluster'].includes(additionalInfoType) && (
                    <div>
                      <label>
                        {
                          allInfoItems.find((item) => item.key === additionalInfoType)
                            ?.label
                        }
                        :
                      </label>
                      <button
                        className={styles.generateButton}
                        onClick={() => {
                          // Show generate ideas input
                          setShowGenerateIdeas(true);
                        }}
                      >
                        <i className="fas fa-brain"></i> Generate Ideas
                      </button>
                      {showGenerateIdeas && (
                        <div className={styles.generateIdeasSection}>
                          <label>Enter Keyword for Ideas:</label>
                          <input
                            type="text"
                            value={keywordForIdeas}
                            onChange={(e) => setKeywordForIdeas(e.target.value)}
                          />
                          <button onClick={handleGetIdeas}>Get Ideas</button>

                          {suggestions.length > 0 && (
                            <div className={styles.suggestionsList}>
                              <h4>Suggestions:</h4>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedSuggestions.length === suggestions.length
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSuggestions(suggestions);
                                    } else {
                                      setSelectedSuggestions([]);
                                    }
                                  }}
                                />
                                Select All
                              </label>
                              {suggestions.map((suggestion, index) => (
                                <label key={index}>
                                  <input
                                    type="checkbox"
                                    checked={selectedSuggestions.includes(suggestion)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSuggestions([
                                          ...selectedSuggestions,
                                          suggestion,
                                        ]);
                                      } else {
                                        setSelectedSuggestions(
                                          selectedSuggestions.filter(
                                            (s) => s !== suggestion
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  {suggestion.keyword} ({suggestion.source})
                                </label>
                              ))}
                            </div>
                          )}

                          <div className={styles.overrideOptions}>
                            <label>
                              <input
                                type="radio"
                                checked={overrideExisting}
                                onChange={() => setOverrideExisting(true)}
                              />
                              Override Existing Items
                            </label>
                            <label>
                              <input
                                type="radio"
                                checked={!overrideExisting}
                                onChange={() => setOverrideExisting(false)}
                              />
                              Add to Existing Items
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Other Additional Info Types */}
                  {['existing_content', 'existing_product_info', 'brand_terms'].includes(
                    additionalInfoType
                  ) && (
                    <div>
                      <label>
                        Enter{' '}
                        {
                          allInfoItems.find((item) => item.key === additionalInfoType)
                            ?.label
                        }
                        :
                      </label>
                      <textarea
                        rows="4"
                        value={additionalInfoValue}
                        onChange={(e) => setAdditionalInfoValue(e.target.value)}
                      ></textarea>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.bulkActionButtons}>
                <button onClick={handleApplyBulkAction}>Apply</button>
                <button
                  onClick={() => {
                    setShowBulkActionOptions(false);
                    // Reset states
                    setBulkActionField('');
                    setPageTypeValue('');
                    setContentTypeValue('');
                    setAdditionalInfoType('');
                    setAdditionalInfoValue('');
                    setSelectedSuggestions([]);
                    setSuggestions([]);
                    setShowGenerateIdeas(false);
                    setKeywordForIdeas('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}