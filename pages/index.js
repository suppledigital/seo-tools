import { useSession, signIn } from 'next-auth/react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import DashboardLayoutAccountSidebar from '../components/common/DashboardLayoutAccountSidebar';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Container maxWidth="sm">
        <Typography variant="h4" align="center" gutterBottom>
          Please Sign In
        </Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" color="primary" onClick={() => signIn('google')}>
            Sign in with Google
          </Button>
        </Box>
      </Container>
    );
  }

  return (
      <Container maxWidth="lg">
        <Box mt={4} mb={4}>
          <Typography variant="h4">Welcome to Supple Tools</Typography>
          <Typography variant="body1" mt={2}>
            Please select a tool from the sidebar.
          </Typography>
        </Box>
      </Container>
  );
}
