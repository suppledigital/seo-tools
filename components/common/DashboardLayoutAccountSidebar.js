// components/common/DashboardLayoutAccountSidebar.js
import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Stack,
  Divider,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Typography,
  MenuList,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { Account, AccountPreview, AccountPopoverFooter, SignOutButton } from '@toolpad/core/Account';
import { useRouter } from 'next/router';

import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ChatIcon from '@mui/icons-material/Chat';
import KeyIcon from '@mui/icons-material/VpnKey';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';

const NAVIGATION = [
  { kind: 'header', title: 'Supple Tools' },
  { segment: '', title: 'Home', icon: <HomeIcon /> }, // Removed to prevent duplication
  {
    segment: 'keywords',
    title: 'Keywords',
    icon: <KeyIcon />,
    children: [
      { segment: 'overview', title: 'Overview', icon: <KeyIcon /> },
      { segment: 'importer', title: 'Importer', icon: <KeyIcon /> },
      { segment: 'internal', title: 'Keywords Tool', icon: <KeyIcon /> },
      { segment: 'webceo-keywords', title: 'Keywords Exporter', icon: <KeyIcon /> },

    ],
  },
  {
    segment: 'content',
    title: 'Content',
    icon: <ArticleIcon />,
    children: [
      { segment: 'generate', title: 'Content Generator', icon: <ArticleIcon /> },
      { segment: 'editor', title: 'Content Editor', icon: <ArticleIcon /> },
      { segment: 'train', title: 'Content Training', icon: <ArticleIcon /> },
      //{ segment: 'mining', title: 'Content Mining', icon: <ArticleIcon /> },

    ],
  },
  {
    segment: 'audit',
    title: 'Audit',
    icon: <AssessmentIcon />,
    children: [
      { segment: 'site-audit', title: 'Site Audit', icon: <AssessmentIcon /> },
      { segment: 'trello-audit', title: 'Trello Audit', icon: <ListAltIcon /> },
    ],
  },
  { segment: 'chat', title: 'Chat', icon: <ChatIcon /> },
  { kind: 'divider' },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <SettingsIcon />,
    children: [
      { segment: 'manage-users', title: 'Manage Users', icon: <PersonIcon /> },
      { segment: 'manage-prompts', title: 'Manage Prompts', icon: <ArticleIcon /> },
    ],
  },
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
                <Avatar src={session.user.image}>
                  {session.user.name ? session.user.name[0] : 'U'}
                </Avatar>
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
  const { data: session } = useSession();
  const routerNext = useRouter();

  const router = useMemo(
    () => ({
      pathname: routerNext.pathname,
      searchParams: new URLSearchParams(routerNext.query),
      navigate: (path) => {
        const newPath = path ? `${path}` : '/';
        routerNext.push(newPath);
      },
    }),
    [routerNext]
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
      <DashboardLayout defaultSidebarCollapsed slots={{ sidebarFooter: SidebarFooterAccount }}>
        {children}
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardLayoutAccountSidebar.propTypes = {
  children: PropTypes.node.isRequired,
};
