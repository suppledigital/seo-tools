// components/content/EntryRow.js

import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import styles from './EntryRow.module.css';

export default function EntryRow({
  entry,
  handlers,
  loadingEntries,
  classificationLoading,
  selectedEntries,
  setSelectedEntries,
  lastSelectedEntryId,
  setLastSelectedEntryId,
}) {
  const {
    handleBadgeClick,
    handleBadgeChange,
    renderAdditionalInfoBlocks,
    handleUrlLookup,
    handleKeywordLookup,
    handleSmartAnalysis,
    handleGenerateContent,
    handleDeleteEntry,
    handleCopyContent,
    handleEditContent,
    handleViewContent,
  } = handlers;

  const isSelected = selectedEntries.includes(entry.entry_id);

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;

    if (e.shiftKey && lastSelectedEntryId !== null) {
      // Handle shift-click selection
      handlers.handleShiftClickSelection(entry.entry_id, checked);
    } else {
      // Single selection
      if (checked) {
        setSelectedEntries([...selectedEntries, entry.entry_id]);
      } else {
        setSelectedEntries(selectedEntries.filter((id) => id !== entry.entry_id));
      }
      setLastSelectedEntryId(entry.entry_id);
    }
  };

  return (
    <tr data-entry-id={entry.entry_id} className={isSelected ? styles.selectedRow : ''}>
      {/* Selection Checkbox */}
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
        />
      </td>
      
           {/* URL Cell */}
      <td className={styles.urlCell}>
        {entry.url}
        <i
          className={`fas fa-search ${styles.lookupIcon}`}
          onClick={() => handleUrlLookup(entry.url)}
        ></i>
        <br />
        {/* Page Type Badge */}
        {/* Page Type Badge */}
        {classificationLoading ? (
          <span className={styles.badge}>
            <FontAwesomeIcon icon={faSpinner} spin />
          </span>
        ) : entry.editingField === 'page_type' ? (
          <select
            value={entry.page_type || ''}
            onChange={(e) => handleBadgeChange(entry.entry_id, 'page_type', e.target.value)}
            onBlur={() => {
              // Handle blur event
            }}
          >
            <option value="">Select Page Type</option>
            {[
              'Homepage',
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
        ) : (
          <span
            className={`${styles.badge} ${styles.pageTypeBadge} ${
              entry.page_type ? styles.badgeSet : styles.badgeNotSet
            }`}
            onClick={() => handleBadgeClick(entry.entry_id, 'page_type', entry.page_type)}
          >
            {entry.page_type || 'Select Page Type'} <i className="fas fa-caret-down"></i>
          </span>
        )}
        {/* Content Type Badge */}
        {entry.editingField === 'content_type' ? (
          <select
            value={entry.content_type || ''}
            onChange={(e) => handleBadgeChange(entry.entry_id, 'content_type', e.target.value)}
            onBlur={() => {
              // Handle blur event
            }}
          >
            <option value="">Select Content Type</option>
            {['New Content', 'Additional Content', 'Rewrite Content'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`${styles.badge} ${styles.contentTypeBadge} ${
              entry.content_type ? styles.badgeSet : styles.badgeNotSet
            }`}
            onClick={() => handleBadgeClick(entry.entry_id, 'content_type', entry.content_type)}
          >
            {entry.content_type || 'Select Content Type'} <i className="fas fa-caret-down"></i>
          </span>
        )}
      </td>
      {/* Keywords Cell */}
      <td className={styles.keywordsCell}>
        Primary: {entry.primary_keyword}
        <i
          className={`fas fa-search ${styles.lookupIcon}`}
          onClick={(e) => handleKeywordLookup(e, entry.primary_keyword, entry.entry_id)}
        ></i>
        <i
          className="fas fa-brain"
          onClick={(e) => handleSmartAnalysis(e, entry.primary_keyword, entry.entry_id)}
          style={{ marginLeft: '8px', cursor: 'pointer' }}
          title="Smart Analysis"
        ></i>
        <br />
        Secondary: {entry.secondary_keyword}
        <i
          className={`fas fa-search ${styles.lookupIcon}`}
          onClick={(e) => handleKeywordLookup(e, entry.secondary_keyword, entry.entry_id)}
        ></i>
      </td>
      {/* Additional Info Cell */}
      <td className={styles.additionalInfoCell}>{renderAdditionalInfoBlocks(entry)}</td>
      {/* Generated Content Cell */}
      <td className={styles.generatedContentCell}>
        {loadingEntries[entry.entry_id] ? (
          <i className={`fas fa-spinner fa-spin ${styles.contentSpinner}`}></i>
        ) : entry.generated_content ? (
          <>
            <span className={styles.generatedContent}>{entry.generated_content}</span>
            <div className={styles.contentActions}>
              <i
                className={`fas fa-copy ${styles.contentActionIcon}`}
                title="Copy to Clipboard"
                onClick={() => handleCopyContent(entry.generated_content)}
              ></i>
              <i
                className={`fas fa-redo ${styles.contentActionIcon}`}
                title="Regenerate"
                onClick={() => handleGenerateContent(entry.entry_id)}
              ></i>
              <i
                className={`fas fa-edit ${styles.contentActionIcon}`}
                title="Edit"
                onClick={() => handleEditContent(entry.entry_id)}
              ></i>
              <i
                className={`fas fa-eye ${styles.contentActionIcon}`}
                title="View"
                onClick={() => handleViewContent(entry.generated_content)}
              ></i>
            </div>
          </>
        ) : (
          'No content generated yet.'
        )}
      </td>
      {/* Actions Cell */}
      <td className={styles.actionsCell}>
        <button
          className={styles.actionButton}
          onClick={() => handleGenerateContent(entry.entry_id)}
          disabled={loadingEntries[entry.entry_id]}
        >
          {loadingEntries[entry.entry_id] ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Generating...
            </>
          ) : entry.generated_content ? (
            'Regenerate'
          ) : (
            'Generate'
          )}
        </button>
        <button
          className={styles.deleteButton}
          onClick={() => handleDeleteEntry(entry.entry_id)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
