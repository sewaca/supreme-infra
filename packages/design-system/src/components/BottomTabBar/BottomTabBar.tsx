'use client';

import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';

export type TabItem = {
  label: string;
  value: string;
  icon: ReactNode;
  badge?: number;
};

type Props = {
  tabs: TabItem[];
  currentPath: string;
  onNavigate: (value: string) => void;
};

export function BottomTabBar({ tabs, currentPath, onNavigate }: Props) {
  const activeTab =
    tabs.find((t) => currentPath === t.value || currentPath.startsWith(`${t.value}/`))?.value ?? tabs[0]?.value;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 'var(--z-index-fixed, 1030)',
        borderTop: '1px solid var(--color-border-light, #e8e9ea)',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={activeTab}
        onChange={(_, newValue) => onNavigate(newValue)}
        showLabels
        sx={{
          height: 'calc(48px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxSizing: 'border-box',
          backgroundColor: '#fff',
          '& .MuiBottomNavigationAction-root': {
            color: 'var(--color-text-primary, #000)',
            position: 'relative',
            '& .MuiSvgIcon-root': {
              fontSize: 22,
            },
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 600,
              fontSize: '0.6875rem',
            },
            '&.Mui-selected::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2.5,
              backgroundColor: '#1a237e',
              borderRadius: '0 0 3px 3px',
            },
          },
          '& .Mui-selected': {
            color: '#1a237e !important',
          },
        }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction
            key={tab.value}
            label={tab.label}
            value={tab.value}
            icon={
              tab.badge ? (
                <Badge badgeContent={tab.badge} color="error" max={99}>
                  {tab.icon}
                </Badge>
              ) : (
                tab.icon
              )
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
