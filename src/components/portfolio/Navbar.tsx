import { AppBar, Toolbar, Typography, Box, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#0C1A2B', // deep navy
        px: 2,
        py: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}
    >
      <Toolbar disableGutters sx={{ width: '100%' }}>
        {/* Logo + title -> home */}
        <Box
          component={RouterLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Study With Raj Logo"
            sx={{ height: 40, width: 40, mr: 2 }}
          />
          <Typography
            variant="h5"
            sx={{
              fontFamily: `'Playfair Display', serif`,
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: 1.5,
            }}
          >
            Study with Raj
          </Typography>
        </Box>

        {/* Right side nav */}
        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={1}>
          <Button
            component={RouterLink}
            to="/stock"
            color="inherit"
            variant={location.pathname.startsWith('/stock') ? 'outlined' : 'text'}
            size="small"
          >
            Stock
          </Button>

          <Button
            component={RouterLink}
            to="/grocery"
            color="inherit"
            variant={location.pathname.startsWith('/grocery') ? 'outlined' : 'text'}
            size="small"
          >
            Grocery
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
