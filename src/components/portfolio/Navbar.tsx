import { AppBar, Toolbar, Typography, Box } from '@mui/material';

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
            <Toolbar disableGutters>
                <Box
                    component="img"
                    src="/logo.png"
                    alt="Study With Raj Logo"
                    sx={{
                        height: 40,
                        width: 40,
                        mr: 2,
                    }}
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
            </Toolbar>
        </AppBar>
    );
}
