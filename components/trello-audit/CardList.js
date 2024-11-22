// components/trello-audit/CardList.js
import React from 'react';
import styles from './CardList.module.css';

export default function CardList({ cards, onSelectCard, selectedCard, loading, autoSync, toggleAutoSync }) {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.header}>
        <h2>Cards</h2>
        <label className={styles.autoSyncLabel}>
          <input
            type="checkbox"
            checked={autoSync}
            onChange={toggleAutoSync}
            className={styles.autoSyncCheckbox}
          />
          Enable Auto-sync
        </label>
      </div>
      {loading && <p>Loading cards...</p>}
        <ul className={styles.cardList}>
        {cards.map((card) => {
          const isActive = selectedCard && selectedCard.card_id === card.card_id;
          return (
            <li
              key={card.card_id}
              onClick={() => onSelectCard(card)}
              className={`${styles.cardItem} ${isActive ? styles.activeCardItem : ''}`}
            >
              <div className={styles.cardContent}>
                <div className={styles.authorIcon}>
                  {card.member_initials ? card.member_initials.toUpperCase() : ""}
                </div>
                <span>{card.name}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
