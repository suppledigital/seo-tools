import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import styles from './ChatHistory.module.css';

export default function ChatHistory({ history, setHistory, deleteChat, setCurrentChatId }) {
  const [confirmDelete, setConfirmDelete] = useState(null); // To track which chat is being confirmed for deletion

  const handleDeleteClick = (chatId) => {
    setConfirmDelete(chatId);
  };

  const confirmDeletion = (chatId) => {
    deleteChat(chatId); // Execute deletion
    setConfirmDelete(null); // Reset confirmation
  };

  const cancelDeletion = () => {
    setConfirmDelete(null); // Reset confirmation
  };

  const handleCreateNewChat = () => {
    const newChatId = `chat_${Date.now()}`;
    setHistory((prevHistory) => [newChatId, ...prevHistory]); // Add new chat at top
    setCurrentChatId(newChatId);
    localStorage.setItem(`chat_${newChatId}`, JSON.stringify({ messages: [] }));
  };
  

  return (
    <div className={styles.chatHistory}>
      <h3>Chat Windows</h3>
      <ul>
        {history.map((chatId) => (
          <li key={chatId} className={styles.chatItem}>
            <button onClick={() => setCurrentChatId(chatId)} className={styles.chatButton}>
              {`Chat ${chatId}`}
            </button>
            <FontAwesomeIcon
              icon={faTrash}
              className={styles.deleteIcon}
              onClick={() => handleDeleteClick(chatId)}
            />
            {confirmDelete === chatId && (
              <div className={styles.confirmPopup}>
                <span>Confirm delete?</span>
                <button className={styles.confirmButton} onClick={() => confirmDeletion(chatId)}>Yes</button>
                <button className={styles.cancelButton} onClick={cancelDeletion}>No</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <button onClick={handleCreateNewChat} className={styles.newChatButton}>
        <FontAwesomeIcon icon={faPlus} /> New Chat Window
      </button>
    </div>
  );
}
