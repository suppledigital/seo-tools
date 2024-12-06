// pages/login.js
import { Container, Box, Typography, Button, Card, CardContent } from '@mui/material';
import { signIn } from 'next-auth/react';

export default function CustomLoginPage() {
  return (
    <Container maxWidth="sm">
      <Box mt={10}>
        <Card>
          <CardContent>
            <Typography variant="h4" align="center" gutterBottom>
              Welcome to Supple Tools
            </Typography>
            <Typography variant="body1" align="center" mb={2}>
              Please sign in to continue
            </Typography>
            <Box display="flex" justifyContent="center">
              <Button variant="contained" color="primary" onClick={() => signIn('google')}>
                Sign in with Google
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
