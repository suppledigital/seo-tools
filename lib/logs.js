// lib/logs.js
const inMemoryLogs = {};

export function appendLog(entryId, message) {
  if (!inMemoryLogs[entryId]) {
    inMemoryLogs[entryId] = [];
  }
  inMemoryLogs[entryId].push(message);
}

export function getLogs(entryId) {
  return inMemoryLogs[entryId] || [];
}
