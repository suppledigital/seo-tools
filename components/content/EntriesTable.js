// components/content/EntriesTable.js

import EntryRow from './EntryRow';
import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
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
  setLastSelectedEntryId
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
        {entries.map((entry) => (
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
          />
        ))}
      </tbody>
    </table>
  );
}

