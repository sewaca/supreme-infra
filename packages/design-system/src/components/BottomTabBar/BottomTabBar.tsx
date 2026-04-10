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
        borderTop: '1px solid #00000014',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={activeTab}
        onChange={(_, newValue) => onNavigate(newValue)}
        showLabels
        sx={{
          height: 56,
          backgroundColor: '#fff',
          '& .MuiBottomNavigationAction-root': {
            color: '#00000066',
            minWidth: 0,
            padding: '8px 0 10px',
            position: 'relative',
            transition: 'color 0.15s ease',
            '& .MuiSvgIcon-root': {
              fontSize: 20,
              transition: 'transform 0.15s ease',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.6875rem',
              fontWeight: 400,
              opacity: 1,
              marginTop: 2,
              transition: 'color 0.15s ease',
              '&.Mui-selected': {
                fontSize: '0.6875rem',
                fontWeight: 500,
              },
            },
            '&.Mui-selected': {
              color: '#1a237e',
              '& .MuiSvgIcon-root': {
                transform: 'translateY(-1px)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 2.5,
                borderRadius: '0 0 3px 3px',
                backgroundColor: '#1a237e',
              },
            },
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
