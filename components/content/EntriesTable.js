// components/content/EntriesTable.js

import EntryRow from './EntryRow';
import React from 'react';
import styles from './EntriesTable.module.css';
import { Button } from '@mui/material';

export default function EntriesTable({
  entries,
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
  } = handlers;

  // Sort entries: selected entries first
  const sortedEntries = [...entries].sort((a, b) => {
    const aSelected = selectedEntries.includes(a.entry_id) ? 0 : 1;
    const bSelected = selectedEntries.includes(b.entry_id) ? 0 : 1;
    return aSelected - bSelected;
  });

  return (
    <table className={styles.projectTable}>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectedEntries.length === entries.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedEntries(entries.map((entry) => entry.entry_id));
                } else {
                  setSelectedEntries([]);
                }
              }}
            />
          </th>
          <th>URL</th>
          <th>Keywords</th>
          <th>Additional Info</th>
          <th>Prompt</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sortedEntries.map((entry) => (
            <EntryRow
            key={entry.entry_id}
            entry={entry}
            handlers={handlers}
            loadingEntries={loadingEntries}
            classificationLoading={classificationLoading}
            selectedEntries={selectedEntries}
            setSelectedEntries={setSelectedEntries}
            lastSelectedEntryId={lastSelectedEntryId}
            setLastSelectedEntryId={setLastSelectedEntryId}
            permissionLevel={permissionLevel}
            onShowLogs={onShowLogs}
          />
        ))}
      </tbody>
    </table>
  );
}
