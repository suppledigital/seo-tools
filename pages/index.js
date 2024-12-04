import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Typography,
  IconButton,
} from '@mui/material';
import Link from 'next/link';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Home() {
  const { data: session, status } = useSession();
  const tools = [
    { name: 'Content Generation Tool', link: '/content' },
    { name: 'Site Audit', link: '/audit' },
    { name: 'Trello Audit', link: '/trello-audit' },
    { name: 'Keywords Tool', link: '/keywords' },
    { name: 'Keywords Exporter', link: '/webceo-keywords' },
    { name: 'Chat', link: '/chat' },
  ];

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} mb={4}>
        <Typography variant="h4">Available Tools</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="subtitle1" mr={2}>
            Welcome, {session?.user?.email}
          </Typography>
          <IconButton onClick={() => alert('Settings Coming Soon')}>
            <SettingsIcon />
          </IconButton>
          <Button variant="outlined" color="secondary" onClick={() => signOut()} size="small" sx={{ ml: 2 }}>
            Sign Out
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {tools.map((tool) => (
          <Grid item xs={12} sm={6} md={4} key={tool.link}>
            <Box
              borderRadius={2}
              boxShadow={2}
              p={3}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              height="150px"
              bgcolor="#f9f9f9"
            >
              <Typography variant="h6" gutterBottom>
                {tool.name}
              </Typography>
              <Button
                component={Link}
                href={tool.link}
                variant="outlined"
                color="primary"
                size="small"
              >
                Open
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
