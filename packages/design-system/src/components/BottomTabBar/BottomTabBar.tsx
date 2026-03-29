'use client';

import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import type { ReactNode } from 'react';

export type TabItem = {
  label: string;
  value: string;
  icon: ReactNode;
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
          backgroundColor: '#fff',
          '& .MuiBottomNavigationAction-root': {
            color: 'var(--color-text-primary, #000)',
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 600,
              fontSize: '0.6875rem',
            },
          },
          '& .Mui-selected': {
            color: '#1a237e !important',
          },
        }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction key={tab.value} label={tab.label} value={tab.value} icon={tab.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
