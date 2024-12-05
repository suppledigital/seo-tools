// components/content/AdvancedActions.js

import React, { useState, useEffect } from 'react';
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
  const [selectionCriteriaList, setSelectionCriteriaList] = useState([
    { logicalOperator: null, criteria: '', criteriaOperator: '', value: '' },
  ]);
  const [showGenerateIdeas, setShowGenerateIdeas] = useState(false);
  const [keywordForIdeas, setKeywordForIdeas] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [overrideExisting, setOverrideExisting] = useState(true);
  const [assignRandomly, setAssignRandomly] = useState(false);
  const [numberOfRandomValues, setNumberOfRandomValues] = useState(1);

  const allInfoItems = [
    { key: 'word_count', label: 'Word Count' },
    { key: 'lsi_terms', label: 'LSI Terms' },
    { key: 'paa_terms', label: 'PAA Terms' },
    { key: 'topic_cluster', label: 'Topic Cluster' },
    { key: 'existing_content', label: 'Existing Content' },
    { key: 'existing_product_info', label: 'Existing Product Info' },
    { key: 'brand_terms', label: 'Brand Terms' },
  ];

  // Compute counts for Page Types
  const pageTypeCounts = {};
  entries.forEach((entry) => {
    const type = entry.page_type || 'Unassigned';
    pageTypeCounts[type] = (pageTypeCounts[type] || 0) + 1;
  });

  // Compute counts for Content Types
  const contentTypeCounts = {};
  entries.forEach((entry) => {
    const type = entry.content_type || 'Unassigned';
    contentTypeCounts[type] = (contentTypeCounts[type] || 0) + 1;
  });

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleSelectAll = () => {
    setSelectedEntries(entries.map((entry) => entry.entry_id));
  };

  const handleDeselectAll = () => {
    setSelectedEntries([]);
    setSelectionCriteriaList([
      { logicalOperator: null, criteria: '', criteriaOperator: '', value: '' },
    ]); // Reset selection criteria
  };

  // Handle changes in criteria and values
  const handleCriteriaChange = (index, field, value) => {
    setSelectionCriteriaList((prevList) => {
      const newList = [...prevList];
      newList[index][field] = value;

      // If the criteria type changes, reset its value and criteriaOperator
      if (field === 'criteria') {
        newList[index]['value'] = '';
        newList[index]['criteriaOperator'] = '';
      }

      return newList;
    });
  };

  // Apply selection whenever selectionCriteriaList changes
  useEffect(() => {
    applySelection(selectionCriteriaList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionCriteriaList]);

  const applySelection = (criteriaList) => {
    let selected = [];

    criteriaList.forEach((criteriaObj, idx) => {
      const { criteria, value, criteriaOperator, logicalOperator } = criteriaObj;

      if (!criteria) return;

      let filteredEntries = [];

      // Filter based on criteria type and operator
      if (criteria === 'page_type') {
        if (value === 'unassigned') {
          filteredEntries = entries.filter((entry) => !entry.page_type);
        } else {
          filteredEntries = entries.filter((entry) => entry.page_type === value);
        }
      } else if (criteria === 'content_type') {
        if (value === 'unassigned') {
          filteredEntries = entries.filter((entry) => !entry.content_type);
        } else {
          filteredEntries = entries.filter((entry) => entry.content_type === value);
        }
      } else if (criteria === 'url') {
        if (criteriaOperator === 'contains') {
          filteredEntries = entries.filter((entry) =>
            entry.url.toLowerCase().includes(value.toLowerCase())
          );
        } else if (criteriaOperator === 'starts_with') {
          filteredEntries = entries.filter((entry) =>
            entry.url.toLowerCase().startsWith(value.toLowerCase())
          );
        }
      } else if (criteria === 'keyword') {
        if (criteriaOperator === 'contains') {
          filteredEntries = entries.filter(
            (entry) =>
              (entry.primary_keyword &&
                entry.primary_keyword.toLowerCase().includes(value.toLowerCase())) ||
              (entry.secondary_keyword &&
                entry.secondary_keyword.toLowerCase().includes(value.toLowerCase()))
          );
        } else if (criteriaOperator === 'starts_with') {
          filteredEntries = entries.filter(
            (entry) =>
              (entry.primary_keyword &&
                entry.primary_keyword.toLowerCase().startsWith(value.toLowerCase())) ||
              (entry.secondary_keyword &&
                entry.secondary_keyword.toLowerCase().startsWith(value.toLowerCase()))
          );
        }
      } else if (criteria === 'select_all') {
        filteredEntries = entries;
      }

      if (filteredEntries.length === 0) return; // Skip if no entries match

      if (idx === 0) {
        // First criteria, initialize selected
        selected = filteredEntries;
      } else {
        if (criteriaObj.logicalOperator === 'AND') {
          // Intersection
          selected = selected.filter((entry) =>
            filteredEntries.some((e) => e.entry_id === entry.entry_id)
          );
        } else if (criteriaObj.logicalOperator === 'OR') {
          // Union
          const entryIds = new Set(selected.map((entry) => entry.entry_id));
          filteredEntries.forEach((entry) => {
            if (!entryIds.has(entry.entry_id)) {
              selected.push(entry);
              entryIds.add(entry.entry_id); // Prevent duplicates
            }
          });
        }
      }
    });

    setSelectedEntries(selected.map((entry) => entry.entry_id));
  };

  // Function to handle adding new criteria
  const addCriteria = (logicalOperator) => {
    setSelectionCriteriaList((prevList) => [
      ...prevList,
      { logicalOperator: logicalOperator, criteria: '', criteriaOperator: '', value: '' },
    ]);
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
      if (additionalInfoType === 'lsi_terms') {
        response = await axios.post('/api/content/semrush/paa-suggestions', {
          keyword: keywordForIdeas,
          country: 'AU',
        });
        setSuggestions([
          ...response.data.relatedKeywords.map((kw) => ({ ...kw, source: 'Related' })),
          ...response.data.broadMatchKeywords.map((kw) => ({ ...kw, source: 'Broad' })),
        ]);
      } else if (additionalInfoType === 'paa_terms') {
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

  const handleApplyBulkAction = async () => {
    let actionValue = null;
  
    if (bulkActionField === 'page_type') {
      actionValue = pageTypeValue;
    } else if (bulkActionField === 'content_type') {
      actionValue = contentTypeValue;
    } else if (bulkActionField === 'additional_info') {
      if (
        assignRandomly &&
        ['lsi_terms', 'paa_terms', 'brand_terms'].includes(additionalInfoType)
      ) {
        // Prepare valuesArray based on additionalInfoType
        let valuesArray = [];
  
        if (['lsi_terms', 'paa_terms'].includes(additionalInfoType)) {
          if (selectedSuggestions.length === 0) {
            alert('Please select suggestions to assign.');
            return;
          }
          valuesArray = selectedSuggestions.map((suggestion) => suggestion.keyword);
        } else if (additionalInfoType === 'brand_terms') {
          valuesArray = additionalInfoValue
            .split(/[\n,]+/)
            .map((val) => val.trim())
            .filter((val) => val);
          if (valuesArray.length === 0) {
            alert('Please enter values to assign.');
            return;
          }
        }
  
        // Prepare data for random assignment
        actionValue = {
          [additionalInfoType]: {
            randomAssignment: true,
            values: valuesArray,
            numberOfValues: parseInt(numberOfRandomValues, 10),
            overrideExisting: overrideExisting,
          },
        };
      } else if (['lsi_terms', 'paa_terms', 'topic_cluster'].includes(additionalInfoType)) {
        // When not assigning randomly, use selected suggestions
        if (selectedSuggestions.length === 0) {
          alert('Please select suggestions to assign.');
          return;
        }
        actionValue = {
          [additionalInfoType]: {
            suggestions: selectedSuggestions.map((s) => s.keyword),
            overrideExisting: overrideExisting,
          },
        };
      } else {
        // For other additional info types
        actionValue = { [additionalInfoType]: additionalInfoValue };
      }
    }
  
    await applyBulkAction(bulkActionType, bulkActionField, actionValue);
  
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
    setAssignRandomly(false);
    setNumberOfRandomValues(1);
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
            {selectionCriteriaList.map((criteriaObj, index) => (
              <div key={index} className={styles.individualSelectContainer}>
                {/* Display Logical Operator for Criteria After the First */}
                {index > 0 && (
                  <span className={styles.logicalOperatorLabel}>
                    {criteriaObj.logicalOperator}
                  </span>
                )}

                {/* Criteria Type Dropdown */}
                <select
                  value={criteriaObj.criteria}
                  onChange={(e) => handleCriteriaChange(index, 'criteria', e.target.value)}
                >
                  <option value="">--Select Criteria--</option>
                  <option value="page_type">Page Type</option>
                  <option value="content_type">Content Type</option>
                  <option value="url">URL</option>
                  <option value="keyword">Keywords</option>
                  <option value="select_all">Select All</option>
                </select>

                {/* Criteria-Specific Operator Dropdown */}
                {['url', 'keyword'].includes(criteriaObj.criteria) && (
                  <select
                    value={criteriaObj.criteriaOperator}
                    onChange={(e) =>
                      handleCriteriaChange(index, 'criteriaOperator', e.target.value)
                    }
                  >
                    <option value="">--Select Operator--</option>
                    <option value="contains">Contains</option>
                    <option value="starts_with">Starts with</option>
                  </select>
                )}

                {/* Value Input or Selection */}
                {['page_type', 'content_type'].includes(criteriaObj.criteria) && (
                  <select
                    value={criteriaObj.value}
                    onChange={(e) => handleCriteriaChange(index, 'value', e.target.value)}
                  >
                    <option value="">
                      --Select{' '}
                      {criteriaObj.criteria === 'page_type' ? 'Page Type' : 'Content Type'}--
                    </option>
                    {criteriaObj.criteria === 'page_type' &&
                      Object.keys(pageTypeCounts).map((type) => (
                        <option key={type} value={type === 'Unassigned' ? 'unassigned' : type}>
                          {type} ({pageTypeCounts[type]})
                        </option>
                      ))}
                    {criteriaObj.criteria === 'content_type' &&
                      Object.keys(contentTypeCounts).map((type) => (
                        <option key={type} value={type === 'Unassigned' ? 'unassigned' : type}>
                          {type} ({contentTypeCounts[type]})
                        </option>
                      ))}
                  </select>
                )}

                {['url', 'keyword'].includes(criteriaObj.criteria) && (
                  <input
                    type="text"
                    placeholder="Enter value..."
                    value={criteriaObj.value}
                    onChange={(e) => handleCriteriaChange(index, 'value', e.target.value)}
                  />
                )}

                {/* Operator Links for Adding New Criteria */}
                {index === selectionCriteriaList.length - 1 && (
                  <div className={styles.operatorLinks}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        // Validate current criterion before adding a new one
                        const currentCriteria = selectionCriteriaList[index];
                        const isCriteriaValid =
                          currentCriteria.criteria &&
                          (currentCriteria.value || currentCriteria.criteria === 'select_all') &&
                          (['url', 'keyword'].includes(currentCriteria.criteria)
                            ? currentCriteria.criteriaOperator
                            : true);

                        if (isCriteriaValid) {
                          addCriteria('AND');
                        } else {
                          alert('Please complete the current criteria before adding a new one.');
                        }
                      }}
                    >
                      And
                    </a>
                    {' | '}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const currentCriteria = selectionCriteriaList[index];
                        const isCriteriaValid =
                          currentCriteria.criteria &&
                          (currentCriteria.value || currentCriteria.criteria === 'select_all') &&
                          (['url', 'keyword'].includes(currentCriteria.criteria)
                            ? currentCriteria.criteriaOperator
                            : true);

                        if (isCriteriaValid) {
                          addCriteria('OR');
                        } else {
                          alert('Please complete the current criteria before adding a new one.');
                        }
                      }}
                    >
                      Or
                    </a>
                  </div>
                )}
              </div>
            ))}

            <div className={styles.selectAllContainer}>
              <span>or you can also</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectAll();
                }}
              >
                Select All
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeselectAll();
                }}
              >
                Deselect All
              </a>
            </div>
            <div className={styles.bulkActions}>
              <button onClick={handleBulkModify}>Modify Selections</button>
              <button className={`${styles.resetBtn}`} onClick={handleBulkReset}>
                Reset Values
              </button>
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
                    setAssignRandomly(false);
                    setNumberOfRandomValues(1);
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
                      setAssignRandomly(false);
                      setNumberOfRandomValues(1);
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
                        {allInfoItems.find((item) => item.key === additionalInfoType)?.label}:
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
                                  checked={selectedSuggestions.length === suggestions.length}
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
                                          selectedSuggestions.filter((s) => s !== suggestion)
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

                          {/* Assign Randomly Option */}
                          <div className={styles.randomiseOptions}>
                          <label>
                            <input
                              type="checkbox"
                              checked={assignRandomly}
                              onChange={(e) => setAssignRandomly(e.target.checked)}
                            />
                            Assign randomly to selected entries
                          </label>
                          </div>

                          {assignRandomly && (
                            <div>
                              <label>
                                Assign{' '}
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={numberOfRandomValues}
                                  onChange={(e) => setNumberOfRandomValues(e.target.value)}
                                  style={{ width: '50px', margin: '0 5px' }}
                                />{' '}
                                random values to each selection
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* LSI Terms, PAA Terms, Brand Terms without Generate Ideas */}
                  {['lsi_terms', 'paa_terms', 'brand_terms'].includes(additionalInfoType) &&
                    !['lsi_terms', 'paa_terms', 'topic_cluster'].includes(additionalInfoType) && (
                      <div>
                        <label>
                          Enter{' '}
                          {allInfoItems.find((item) => item.key === additionalInfoType)?.label}:
                        </label>
                        <textarea
                          rows="4"
                          value={additionalInfoValue}
                          onChange={(e) => setAdditionalInfoValue(e.target.value)}
                        ></textarea>

                        {/* Assign Randomly Option */}
                        <label>
                          <input
                            type="checkbox"
                            checked={assignRandomly}
                            onChange={(e) => setAssignRandomly(e.target.checked)}
                          />
                          Assign randomly to selected entries
                        </label>

                        {assignRandomly && (
                          <div>
                            <label>
                              Assign{' '}
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={numberOfRandomValues}
                                onChange={(e) => setNumberOfRandomValues(e.target.value)}
                                style={{ width: '50px', margin: '0 5px' }}
                              />{' '}
                              random values to each selection
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Other Additional Info Types */}
                  {['existing_content', 'existing_product_info'].includes(additionalInfoType) && (
                    <div>
                      <label>
                        Enter{' '}
                        {allInfoItems.find((item) => item.key === additionalInfoType)?.label}:
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
                    setAssignRandomly(false);
                    setNumberOfRandomValues(1);
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
