// components/content/ContentModal.js

import styles from './ContentModal.module.css';

export default function ContentModal({ isOpen, onClose, content }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <span className={styles.close} onClick={onClose}>
          &times;
        </span>
        <h2>Generated Content</h2>
        <div className={styles.modalTextContent}>{content}</div>
      </div>
    </div>
  );
}
