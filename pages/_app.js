import { SessionProvider } from 'next-auth/react';
import '@fortawesome/fontawesome-free/css/all.min.css';

import '../styles/global.css'; // Import the global CSS
//import '../styles/style.css'; // Import the global CSS
//import '../styles/projects.css'; // Import the global CSS
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Import the CSS manually
config.autoAddCss = false; // Disable the automatic adding of CSS


function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;