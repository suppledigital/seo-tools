// components/content/InfoModal.js

import styles from './InfoModal.module.css';

export default function InfoModal({ isVisible, onClose, title, value, onChange, onSave }) {
  if (!isVisible) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <span className={styles.close} onClick={onClose}>
          &times;
        </span>
        <h2>{title}</h2>
        <textarea value={value} onChange={(e) => onChange(e.target.value)}></textarea>
        <button className={styles.saveButton} onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
}
