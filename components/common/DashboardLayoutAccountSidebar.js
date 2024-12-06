import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Box, Typography, Stack, Divider, MenuList, MenuItem, ListItemText, ListItemIcon, Avatar } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { Account, AccountPreview, AccountPopoverFooter, SignOutButton } from '@toolpad/core/Account';

import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ChatIcon from '@mui/icons-material/Chat';
import KeyIcon from '@mui/icons-material/VpnKey';

const NAVIGATION = [
  { kind: 'header', title: 'Supple Tools' },
  // Use relative segments so that toolpad can construct valid URLs from pathname
  { segment: '', title: 'Home', icon: <HomeIcon /> },
  { segment: 'content', title: 'Content Generation Tool', icon: <ArticleIcon /> },
  { segment: 'audit', title: 'Site Audit', icon: <AssessmentIcon /> },
  { segment: 'trello-audit', title: 'Trello Audit', icon: <ListAltIcon /> },
  { segment: 'keywords', title: 'Keywords Tool', icon: <KeyIcon /> },
  { segment: 'webceo-keywords', title: 'Keywords Exporter', icon: <KeyIcon /> },
  { segment: 'chat', title: 'Chat', icon: <ChatIcon /> },
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
          avatar={session?.user?.image}
          name={session?.user?.name}
          email={session?.user?.email}
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
                <Avatar src={session.user.image}>{session.user.name ? session.user.name[0] : 'U'}</Avatar>
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
  const PreviewComponent = useMemo(() => (props) => <AccountSidebarPreview {...props} mini={mini} />, [mini]);
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
  const { data: session } = useSession();

  // Use an absolute URL as the base for pathname
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/'
  );

  // Create a router that can handle navigation
  const router = useMemo(() => ({
    pathname,
    searchParams: new URLSearchParams(),
    navigate: (path) => {
      // Construct a full URL using the current pathname as base
      const baseUrl = new URL(pathname);
      const newUrl = new URL(path, baseUrl);
      setPathname(newUrl.href);

      // Actually navigate in the browser
      if (typeof window !== 'undefined') {
        window.location.href = newUrl.href;
      }
    },
  }), [pathname]);

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
      <DashboardLayout slots={{ sidebarFooter: SidebarFooterAccount }}>
        {children}
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardLayoutAccountSidebar.propTypes = {
  children: PropTypes.node.isRequired,
};
