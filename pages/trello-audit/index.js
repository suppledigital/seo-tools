// pages/trello-audit/index.js
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import CardList from '../../components/trello-audit/CardList';
import Timeline from '../../components/trello-audit/Timeline';
import axios from 'axios';
import styles from './TrelloAudit.module.css';

export default function TrelloAudit() {
  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const autoSyncInterval = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && status === 'authenticated') {
      fetchCardsFromDatabase();
    }
  }, [isMounted, status]);

  const fetchCardsFromDatabase = () => {
    axios
      .get('/api/trello-audit/get-cards')
      .then((response) => setCards(response.data.cards))
      .catch((error) => console.error('Error fetching cards:', error));
  };

  const fetchCardsFromTrello = () => {
    axios
      .get('/api/trello-audit/fetch-cards')
      .then((response) => setCards(response.data.cards))
      .catch((error) => console.error('Error fetching cards from Trello:', error));
  };

  // Auto-sync functionality
  useEffect(() => {
    if (autoSync) {
      fetchCardsFromTrello(); // Initial fetch when auto-sync is enabled
      autoSyncInterval.current = setInterval(fetchCardsFromTrello, 60000); // Fetch every 60 seconds
    } else {
      clearInterval(autoSyncInterval.current);
    }
    return () => clearInterval(autoSyncInterval.current);
  }, [autoSync]);

  const handleSelectCard = (card) => {
    setSelectedCard(card);
  };

  const toggleAutoSync = () => {
    setAutoSync(!autoSync);
  };

  if (!isMounted || status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Please Sign In</h1>
        <button className={styles.button} onClick={() => signIn('google')}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="trelloAuditContainer">
    <div className={styles.mainContainer}>
      <div className={styles.content}>
      <CardList
        cards={cards}
        onSelectCard={handleSelectCard}
        selectedCard={selectedCard} // Pass selectedCard
        loading={loading}
        autoSync={autoSync}
        toggleAutoSync={toggleAutoSync}
        />
        <Timeline card={selectedCard} />
      </div>
    </div>
    <style jsx global>{`
        /* Your global styles */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
        }

        h4,
        h5 {
          margin: 10px 0;
        }

        p,
        label,
        select {
          font-size: 14px;
        }

        /* You can include more global styles here */
      `}</style>
    </div>
  );
}
