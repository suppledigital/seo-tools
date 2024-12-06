import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Box,
  Typography,
  Stack,
  Divider,
  MenuList,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
} from '@mui/material';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import {
  Account,
  AccountPreview,
  AccountPopoverFooter,
  SignOutButton,
} from '@toolpad/core/Account';
import { createTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ChatIcon from '@mui/icons-material/Chat';
import KeyIcon from '@mui/icons-material/VpnKey';
import Link from 'next/link';

const NAVIGATION = [
  { kind: 'header', title: 'Supple Tools' },
  { segment: '/', title: 'Home', icon: <HomeIcon /> },
  { segment: '/content', title: 'Content Generation Tool', icon: <ArticleIcon /> },
  { segment: '/audit', title: 'Site Audit', icon: <AssessmentIcon /> },
  { segment: '/trello-audit', title: 'Trello Audit', icon: <ListAltIcon /> },
  { segment: '/keywords', title: 'Keywords Tool', icon: <KeyIcon /> },
  { segment: '/webceo-keywords', title: 'Keywords Exporter', icon: <KeyIcon /> },
  { segment: '/chat', title: 'Chat', icon: <ChatIcon /> },
];

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-toolpad-color-scheme',
  },
  colorSchemes: { light: true, dark: true },
});

function AccountSidebarPreview({ handleClick, open, mini }) {
  const { data: session, status } = useSession();

  return (
    <Stack direction="column" p={0} overflow="hidden">
      <Divider />
      {status === 'authenticated' ? (
        <AccountPreview
          variant={mini ? 'condensed' : 'expanded'}
          handleClick={handleClick}
          open={open}
          avatar={session.user.image}
          name={session.user.name}
          email={session.user.email}
        />
      ) : (
        <MenuItem onClick={() => signIn('google')}>
          <ListItemText primary="Sign In" />
        </MenuItem>
      )}
    </Stack>
  );
}

AccountSidebarPreview.propTypes = {
  handleClick: PropTypes.func,
  mini: PropTypes.bool.isRequired,
  open: PropTypes.bool,
};

function SidebarFooterAccountPopover() {
  const { data: session } = useSession();

  return (
    <Stack direction="column">
      {session && (
        <>
          <Typography variant="body2" mx={2} mt={1}>
            Account
          </Typography>
          <MenuList>
            <MenuItem>
              <ListItemIcon>
                <Avatar src={session.user.image}>{session.user.name[0]}</Avatar>
              </ListItemIcon>
              <ListItemText
                primary={session.user.name}
                secondary={session.user.email}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </MenuItem>
          </MenuList>
          <Divider />
          <AccountPopoverFooter>
            <SignOutButton onClick={() => signOut()} />
          </AccountPopoverFooter>
        </>
      )}
    </Stack>
  );
}

function SidebarFooterAccount({ mini }) {
  const PreviewComponent = useMemo(
    () => (props) => <AccountSidebarPreview {...props} mini={mini} />,
    [mini]
  );
  return (
    <Account
      slots={{
        preview: PreviewComponent,
        popoverContent: SidebarFooterAccountPopover,
      }}
    />
  );
}

SidebarFooterAccount.propTypes = {
  mini: PropTypes.bool.isRequired,
};

export default function DashboardLayoutAccountSidebar({ children }) {
  const { data: session, status } = useSession();
  const [pathname, setPathname] = useState('/');
  const router = useMemo(
    () => ({
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    }),
    [pathname]
  );

  const authentication = useMemo(
    () => ({
      signIn: () => signIn('google'),
      signOut: () => signOut(),
    }),
    []
  );

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      theme={theme}
      authentication={authentication}
      session={session}
    >
      <DashboardLayout
        slots={{
          sidebarFooter: SidebarFooterAccount,
        }}
      >
        {children}
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardLayoutAccountSidebar.propTypes = {
  children: PropTypes.node.isRequired,
};
