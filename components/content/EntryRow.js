// components/content/EntryRow.js

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationCircle, faDeleteLeft, faRecycle } from '@fortawesome/free-solid-svg-icons';
import styles from './EntryRow.module.css';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip'; // Import Tooltip for better UX

import { utcToZonedTime, format } from 'date-fns-tz';

const melbourneTimeZone = 'Australia/Melbourne'; // Set the timezone explicitly


export default function EntryRow({
  entry,
  handlers,
  loadingEntries,
  classificationLoading,
  selectedEntries,
  setSelectedEntries,
  lastSelectedEntryId,
  setLastSelectedEntryId,
  permissionLevel,
  onShowLogs
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
    handleHumanizeContent, // Ensure this handler is passed
  } = handlers;

// Helper function to determine score class
const getScoreClass = (score) => {
  if (score > 75) return styles.error;
  if (score >= 50) return styles.warning;
  return styles.okay;
};


// Convert the UTC date to Melbourne timezone
const utcDate = new Date(`${entry.updated_at}Z`); // Add 'Z' to enforce UTC interpretation
const melbourneDate = utcToZonedTime(utcDate, melbourneTimeZone); // Convert to Melbourne timezone
const formattedMelbourneDate = format(melbourneDate, 'dd MMM yyyy, hh:mm a', { timeZone: melbourneTimeZone });

  const isSelected = selectedEntries.includes(entry.entry_id);
  const wordCount = entry.generated_content
    ? entry.generated_content.trim().split(/\s+/).length
    : 0;
  const humanisedWordCount = entry.humanized_content
    ? entry.humanized_content.trim().split(/\s+/).length
    : 0;

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
        {entry.page_type ? (
          <span
            className={`${styles.badge} ${styles.pageTypeBadge} ${styles.badgeSet}`}
            onClick={() => handleBadgeClick(entry.entry_id, 'page_type', entry.page_type)}
          >
            {entry.page_type} <i className="fas fa-caret-down"></i>
          </span>
        ) : (
          <span
            className={`${styles.badge} ${styles.pageTypeBadge} ${styles.badgeNotSet}`}
            onClick={() => handleBadgeClick(entry.entry_id, 'page_type', entry.page_type)}
          >
            Select Page Type <i className="fas fa-caret-down"></i>
          </span>
        )}
        {/* Content Type Badge */}
        {entry.content_type ? (
          <span
            className={`${styles.badge} ${styles.contentTypeBadge} ${styles.badgeSet}`}
            onClick={() => handleBadgeClick(entry.entry_id, 'content_type', entry.content_type)}
          >
            {entry.content_type} <i className="fas fa-caret-down"></i>
          </span>
        ) : (
          <span
            className={`${styles.badge} ${styles.contentTypeBadge} ${styles.badgeNotSet}`}
            onClick={() => handleBadgeClick(entry.entry_id, 'content_type', entry.content_type)}
          >
            Select Content Type <i className="fas fa-caret-down"></i>
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
      
        {/* If not humanizing, check generating */}
        {entry.task_status === 'Queued' && entry.task_id_generate && (
          <div>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Queued (Generating)...</span>
          </div>
        )}

        {entry.task_status === 'Processing' && entry.task_id_generate && (
          <div className={styles.loadingContainer}>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Generating...</span>
          </div>
        )}

        {entry.task_status === 'Failed' && (
          <div>
            <span style={{ color: 'red' }}>Failed: {entry.error_message}</span>
            {/* Show a regenerate button if desired */}
            <button onClick={() => handleGenerateContent(entry.entry_id)}>Regenerate</button>
          </div>
        )}
        {entry.task_status === 'Completed' && entry.generated_content && (
          <>
            <span className={styles.generatedContent}>{entry.generated_content}</span>
            <div className={styles.contentActions}>
              <i
                className={`fas fa-copy ${styles.contentActionIcon}`}
                title="Copy to Clipboard"
                onClick={() => handleCopyContent(entry.generated_content)}
              ></i>
              <i
                className={`fas fa-redo ${styles.contentActionIcon} ${styles.redoActionIcon}`}
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
                onClick={() => handleViewContent(entry)}
              ></i>
              {/* Word Count Badge */}
              <span className={styles.wordCountBadge} title="Word Count">
                {wordCount} words
              </span>
              <span
                className={`${styles.wordCountBadge} ${getScoreClass(entry.rephrasy_score_generate)}`}
                title="AI Detection Score"
              >
                AI: {entry.rephrasy_score_generate}
              </span>
              <div className={styles.lastUpdated}>
              <small>Last Updated: {formattedMelbourneDate}</small>

</div>


            </div>
          </>
       )}
       {entry.task_status === null && !entry.generated_content && (
         'No content generated yet.'
       )}
     </td>
     <td className={styles.generatedContentCell}>
      {entry.task_status === 'Queued' && entry.task_id_humanise && (
          <div>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Queued (Humanizing)...</span>
          </div>
        )}

        {entry.task_status === 'Processing' && entry.task_id_humanise && (
          <div className={styles.loadingContainer}>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Humanizing...</span>
          </div>
        )}

        {entry.task_status === 'Completed' && entry.humanized_content && (
          <>
            <span className={styles.generatedContent}>{entry.humanized_content}</span>
            <div className={styles.contentActions}>
              <i
                className={`fas fa-copy ${styles.contentActionIcon}`}
                title="Copy to Clipboard"
                onClick={() => handleCopyContent(entry.humanized_content)}
              ></i>
              <i
                className={`fas fa-redo ${styles.contentActionIcon} ${styles.redoActionIcon}`}
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
                onClick={() => handleViewContent(entry)}
              ></i>
              {/* Word Count Badge */}
              <span className={styles.wordCountBadge} title="Word Count">
                {humanisedWordCount} words
              </span>
              <span
                className={`${styles.wordCountBadge} ${getScoreClass(entry.rephrasy_score_humanise)}`}
                title="AI Detection Score"
              >
                AI: {entry.rephrasy_score_humanise}
              </span>
              <div className={styles.lastUpdated}>
              <small>Last Updated: {formattedMelbourneDate}</small>

</div>


            </div>
          </>
       )}
       {entry.task_status === null && (!entry.humanized_content) && (
         'Content not humanised yet.'
       )}
     </td>

      {/* Actions Cell */}
       {/* Actions Cell */}
       <td className={styles.actionsCell}>
       <button
          className={styles.actionButton}
          onClick={() => handlers.handleGenerateContent(entry.entry_id)}
          disabled={entry.task_status === 'Queued' || entry.task_status === 'Processing'}
        >
          {entry.task_status === 'Processing'
            ? 'Generating...'
            : entry.task_status === 'Queued'
            ? 'Queued...'
            : 'Generate'}
        </button>

        <button
          className={styles.actionButton}
          onClick={() => handlers.handleHumanizeContent(entry.entry_id)}
          disabled={!entry.generated_content || entry.task_status === 'Processing' || entry.task_status === 'Queued'}
        >
          {entry.task_id_humanise && (entry.task_status === 'Queued' || entry.task_status === 'Processing')
            ? 'Humanizing...'
            : 'Humanize'}
        </button>


        <button className={styles.deleteButton} onClick={() => handleDeleteEntry(entry.entry_id)}>
          Delete
        </button>
        <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red', marginLeft: '8px' }} onClick={() => handleDeleteEntry(entry.entry_id)} />


        {permissionLevel === 'admin' && (
          <i
            className="fas fa-code"
            title="Show Console"
            style={{ marginLeft: '8px', cursor: 'pointer' }}
            onClick={() => onShowLogs(entry.entry_id)}
          ></i>
        )}

        {/* Display Error Messages */}
        {entry.last_task_generate_failed && (
          <Tooltip title="Last Generate Prompt task failed. Please try again.">
            <span className={styles.errorMessage}>
              <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red', marginLeft: '8px' }} />
            </span>
          </Tooltip>
        )}

        {entry.last_task_humanise_failed && (
          <Tooltip title="Last Humanize task failed. Please try again.">
            <span className={styles.errorMessage}>
              <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red', marginLeft: '8px' }} />
            </span>
          </Tooltip>
        )}
      </td>
    </tr>
  );
}
