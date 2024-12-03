// pages/content/settings.js
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './settings.module.css'; // Create a new CSS module for settings

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (!session) router.push('/'); // Redirect if not authenticated
    if (session.user.permissions_level !== 'admin') router.push('/'); // Redirect if not admin
  }, [session, status, router]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>
      <div className={styles.options}>
        <Link legacyBehavior href="/content/settings/manage-users">
          <a className={styles.optionCard}>
            <i className="fas fa-users-cog fa-2x"></i>
            <span>Manage Users</span>
          </a>
        </Link>
        <Link legacyBehavior href="/content/settings/manage-prompts">
          <a className={styles.optionCard}>
            <i className="fas fa-edit fa-2x"></i>
            <span>Manage Prompts</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
