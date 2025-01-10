// pages/content/settings.js
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Box,
   
    Container,
    Typography,
    List,
    ListItem,
    Link,
  } from '@mui/material';
  import { PageContainer } from '@toolpad/core/PageContainer';


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
    <Container fixed sx={{ mt: 4, mb: 4 }}>
        <PageContainer></PageContainer>
        

        <div>
            <List>
                <ListItem
                    key="1"
                    sx={{
                        mb: 1,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        '&:hover': { backgroundColor: '#ededed' },
                    }}
                    >
                        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                            <Box display="flex" alignItems="center">
                                <Typography variant="body1" sx={{ ml: 2, fontWeight: 500 }}>
                                    <Link legacyBehavior href="/content/generate">
                                        <a>
                                            <span>Content Generator</span>
                                        </a>
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                </ListItem>
                <ListItem
                    key="2"
                    sx={{
                        mb: 1,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        '&:hover': { backgroundColor: '#ededed' },
                    }}
                    >
                        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                            <Box display="flex" alignItems="center">
                                <Typography variant="body1" sx={{ ml: 2, fontWeight: 500 }}>
                                    <Link legacyBehavior href="/content/editor">
                                        <a>
                                         <span>Content Editor</span>
                                        </a>
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                </ListItem>
            </List>
        </div>
        </Container>
  );
}
