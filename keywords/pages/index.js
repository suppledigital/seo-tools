// keywords/pages/index.js
import { useSession } from 'next-auth/react';

export default function KeywordsHome() {
  const { data: session, status } = useSession();

  if (status === 'unauthenticated') {
    return <p>Please log in to access the Keywords Tool.</p>;
  }

  return (
    <div>
      <h1>Keywords Tool</h1>
      <p>Welcome to the Keywords Tool, {session.user.email}</p>
    </div>
  );
}
