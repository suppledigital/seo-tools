// components/content/EntryRow.js

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationCircle, faDeleteLeft, faRecycle, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import styles from './EntryRow.module.css';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import { utcToZonedTime, format } from 'date-fns-tz';

const melbourneTimeZone = 'Australia/Melbourne';

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
    handleHumanizeContent
  } = handlers;

  const getScoreClass = (score) => {
    if (score > 25) return styles.error;
    if (score >= 15) return styles.warning;
    return styles.okay;
  };

  // Convert 'updated_at' to Melbourne Time
  const utcDate = new Date(`${entry.updated_at}Z`); 
  const melbourneDate = utcToZonedTime(utcDate, melbourneTimeZone);
  const formattedMelbourneDate = format(melbourneDate, 'dd MMM yyyy, hh:mm a', {
    timeZone: melbourneTimeZone
  });

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
      handlers.handleShiftClickSelection(entry.entry_id, checked);
    } else {
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
      <td>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
        />
      </td>

      {/* URL / Page Type / Content Type */}
      <td className={styles.urlCell}>
        {entry.url}
        <i
          className={`fas fa-search ${styles.lookupIcon}`}
          onClick={() => handleUrlLookup(entry.url)}
        ></i>
        <br />
        {entry.editingField === 'page_type' ? (
          // If user clicked to edit page_type, show a SELECT
          <select
            autoFocus
            value={entry.page_type || ''}
            onChange={(e) => handleBadgeChange(entry.entry_id, 'page_type', e.target.value)}
            onBlur={(e) => handleBadgeChange(entry.entry_id, 'page_type', e.target.value)}
          >
            <option value="">Select Page Type</option>
            <option value="Home Page">Home Page</option>

            <option value="Service Page">Service Page</option>
            <option value="Location Page">Location Page</option>

            <option value="Product Page">Product Page</option>
            <option value="Product Category Page">Category Page</option>
            <option value="Blog Post">Blog Post</option>
            {/* Add more as needed */}
          </select>
        ) : (
          // Else, show the clickable badge
          <>
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
          </>
        )}

        {entry.editingField === 'content_type' ? (
          <select
            autoFocus
            value={entry.content_type || ''}
            onChange={(e) => handleBadgeChange(entry.entry_id, 'content_type', e.target.value)}
            onBlur={(e) => handleBadgeChange(entry.entry_id, 'content_type', e.target.value)}
          >
            <option value="">Select Content Type</option>
            <option value="New Content">New Content</option>
            <option value="Rewrite Content">Rewrite Content</option>
            <option value="Additional Content">Additional Content</option>
          </select>
        ) : (
          <>
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
          </>
        )}

      </td>

      {/* Keywords */}
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

      {/* Additional Info */}
      <td className={styles.additionalInfoCell}>
        {renderAdditionalInfoBlocks(entry)}
      </td>

      {/* Generated Content Column */}
      <td className={styles.generatedContentCell}>
        {/* If no generate task_id, we interpret as "task done or never started" */}
        {!entry.task_id_generate && !entry.generated_content && (
          <>No content generated yet.</>
        )}
        {!entry.task_id_generate && entry.generated_content && (
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
              <span className={styles.wordCountBadge} title="Word Count">
                {wordCount} words
              </span>
              {/* ADD THIS BADGE */}
              <span
                className={`${styles.wordCountBadge} ${getScoreClass(entry.rephrasy_score_generate)}`}
                title="AI Detection Score"
              >
                AI: {entry.rephrasy_score_generate}
              </span>
            </div>
          </>
        )}

        {entry.task_id_generate && entry.task_status_generate === 'Queued' && (
          <div>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Queued (Generating)...</span>
          </div>
        )}
        {entry.task_id_generate && entry.task_status_generate === 'Processing' && (
          <div className={styles.loadingContainer}>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Generating...</span>
          </div>
        )}
        {entry.task_id_generate && entry.task_status_generate === 'Failed' && (
          <div>
            <span style={{ color: 'red' }}>Failed: {entry.error_message}</span>
            <button onClick={() => handleGenerateContent(entry.entry_id)}>
              Regenerate
            </button>
          </div>
        )}
        {entry.task_id_generate &&
          entry.task_status_generate === 'Completed' &&
          entry.generated_content && (
            <>
              <span className={styles.generatedContent}>{entry.generated_content}</span>
              <div className={styles.contentActions}>
                <i
                  className={`fas fa-copy ${styles.contentActionIcon}`}
                  title="Copy"
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
      </td>

      {/* Humanised Content Column */}
      <td className={styles.generatedContentCell}>
        {/* If no humanise task_id, treat as "done or never started" */}
        {!entry.task_id_humanise && !entry.humanized_content && (
          <>Content not humanised yet.</>
        )}
        {!entry.task_id_humanise && entry.humanized_content && (
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
                title="Re-humanise"
                onClick={() => handleHumanizeContent(entry.entry_id)}
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
              <span className={styles.wordCountBadge} title="Word Count">
                {humanisedWordCount} words
              </span>
              {/* ADD THIS BADGE */}
              <span
                className={`${styles.wordCountBadge} ${getScoreClass(entry.rephrasy_score_humanise)}`}
                title="AI Detection Score"
              >
                AI: {entry.rephrasy_score_humanise}
              </span>
            </div>
          </>
        )}

        {entry.task_id_humanise && entry.task_status_humanise === 'Queued' && (
          <div>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Queued (Humanising)...</span>
          </div>
        )}
        {entry.task_id_humanise && entry.task_status_humanise === 'Processing' && (
          <div className={styles.loadingContainer}>
            <CircularProgress size={20} className={styles.spinner} />
            <span>Humanising...</span>
          </div>
        )}
        {entry.task_id_humanise && entry.task_status_humanise === 'Failed' && (
          <div>
            <span style={{ color: 'red' }}>Failed: {entry.error_message}</span>
            <button onClick={() => handleHumanizeContent(entry.entry_id)}>
              Re-humanise
            </button>
          </div>
        )}
        {entry.task_id_humanise &&
          entry.task_status_humanise === 'Completed' &&
          entry.humanized_content && (
            <>
              <span className={styles.generatedContent}>{entry.humanized_content}</span>
              <div className={styles.contentActions}>
                <i
                  className={`fas fa-copy ${styles.contentActionIcon}`}
                  title="Copy"
                  onClick={() => handleCopyContent(entry.humanized_content)}
                ></i>
                <i
                  className={`fas fa-redo ${styles.contentActionIcon} ${styles.redoActionIcon}`}
                  title="Re-humanise"
                  onClick={() => handleHumanizeContent(entry.entry_id)}
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
      </td>

      {/* Actions Cell */}
      <td className={styles.actionsCell}>
        <button
          className={styles.actionButton}
          onClick={() => handlers.handleGenerateContent(entry.entry_id)}
          disabled={
            (entry.task_id_generate &&
              (entry.task_status_generate === 'Queued' ||
               entry.task_status_generate === 'Processing'))
          }
        >
          {entry.task_id_generate &&
          (entry.task_status_generate === 'Queued' ||
           entry.task_status_generate === 'Processing')
            ? 'Generating...'
            : 'Generate'}
        </button>

        <button
          className={styles.actionButton}
          onClick={() => handlers.handleHumanizeContent(entry.entry_id)}
          disabled={
            !entry.generated_content ||
            (entry.task_id_humanise &&
              (entry.task_status_humanise === 'Queued' ||
               entry.task_status_humanise === 'Processing'))
          }
        >
          {entry.task_id_humanise &&
          (entry.task_status_humanise === 'Queued' ||
           entry.task_status_humanise === 'Processing')
            ? 'Humanising...'
            : 'Humanise'}
        </button>

      

        <FontAwesomeIcon
          icon={faTrashCan}
          style={{ color: 'red', marginLeft: '8px' }}
          onClick={() => handleDeleteEntry(entry.entry_id)}
        />

        {permissionLevel === 'admin' && (
          <i
            className="fas fa-code"
            title="Show Console"
            style={{ marginLeft: '8px', cursor: 'pointer' }}
            onClick={() => onShowLogs(entry.entry_id)}
          ></i>
        )}

        {entry.last_task_generate_failed && (
          <Tooltip title="Last Generate Prompt task failed. Please try again.">
            <span className={styles.errorMessage}>
              <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red', marginLeft: '8px' }} />
            </span>
          </Tooltip>
        )}
        {entry.last_task_humanise_failed && (
          <Tooltip title="Last Humanise task failed. Please try again.">
            <span className={styles.errorMessage}>
              <FontAwesomeIcon icon={faExclamationCircle} style={{ color: 'red', marginLeft: '8px' }} />
            </span>
          </Tooltip>
        )}
      </td>
    </tr>
  );
}
