import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './index.module.css'; // Import the CSS module

export default function Home() {
  const { data: session, status } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Please Sign In</h1>
        <button className={styles.button} onClick={() => signIn('google')}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Available Tools</h1>
      <p className={styles.welcomeText}>Welcome, {session?.user?.email}</p>
      <button className={styles.button} onClick={() => signOut()}>Sign Out</button>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <Link href="/content" className={styles.link}>Content Tool</Link>
        </li>
        <li className={styles.listItem}>
          <Link href="/audit" className={styles.link}>Site Audit</Link>
        </li>
        <li className={styles.listItem}>
          <Link href="/keywords" className={styles.link}>Keywords Tool</Link>
        </li>
        <li className={styles.listItem}>
          <Link href="/chat" className={styles.link}>Chat</Link>
        </li>
        
      </ul>
    </div>
  );
}
