import { Box, Button, Divider, IconButton, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SettingsIcon from '@mui/icons-material/Settings';

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/stock', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Profits', to: '/stock/profits', icon: <AttachMoneyIcon fontSize="small" /> },
  { label: 'Tickers', to: '/stock/tickers', icon: <ListAltIcon fontSize="small" /> },
  { label: 'Alert Logs', to: '/stock/alert-logs', icon: <NotificationsActiveIcon fontSize="small" /> },
  { label: 'Settings', to: '/stock/setting', icon: <SettingsIcon fontSize="small" /> },
];

export default function LeftNavBar({ collapsed, onToggleCollapse }: Props) {
  const location = useLocation();

  return (
    <Box sx={{ p: 1.5 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 0.5,
          py: 0.5,
        }}
      >
        {/* Logo + App name (logo click -> portfolio home) */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
            minWidth: 0,
            flex: 1,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
            sx={{ height: 34, width: 34, borderRadius: 1 }}
          />

          {!collapsed ? (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h1" sx={{ fontWeight: 600, lineHeight: 1.1, fontSize: 24 }}>
                Stocks Alert
              </Typography>
            </Box>
          ) : null}
        </Box>

        {/* Hamburger on top row only when expanded */}
        {!collapsed ? (
          <IconButton size="small" onClick={onToggleCollapse} aria-label="Collapse sidebar">
            <MenuIcon />
          </IconButton>
        ) : null}
      </Box>

      {/* Hamburger below logo when collapsed */}
      {collapsed ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <IconButton size="small" onClick={onToggleCollapse} aria-label="Expand sidebar">
            <MenuIcon />
          </IconButton>
        </Box>
      ) : null}

      <Divider sx={{ my: 1.5 }} />

      {/* Nav items */}
      <Stack spacing={0.5}>
        {NAV_ITEMS.map((item) => {
          const active =
            item.to === '/stock'
              ? location.pathname === '/stock'
              : location.pathname.startsWith(item.to);

          return (
            <Button
              key={item.to}
              component={RouterLink}
              to={item.to}
              size="small"
              variant={active ? 'contained' : 'text'}
              fullWidth
              startIcon={collapsed ? undefined : item.icon}
              sx={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                minHeight: 40,
                px: collapsed ? 1 : 1.25,
              }}
            >
              {collapsed ? item.icon : item.label}
            </Button>
          );
        })}
      </Stack>

    </Box>
  );
}
