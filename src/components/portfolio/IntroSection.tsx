import { Box, Typography, Container } from '@mui/material';

export default function IntroSection() {
    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '50vh',
                backgroundImage: 'url(/banner.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
            }}
        >
            <Container
                maxWidth="md"
                sx={{
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    p: 3,
                    borderRadius: 2,
                    textAlign: 'center',
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontFamily: `'Playfair Display', serif`,
                        fontWeight: 600,
                        mb: 2,
                        color: '#0C1A2B',
                    }}
                >
                    Welcome to{' '}
                    <Box
                        component="span"
                        sx={{
                            background: 'linear-gradient(45deg, #00C9FF, #92FE9D)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            fontFamily: `'Playfair Display', serif`,
                        }}
                    >
                        Study With Raj
                    </Box>
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        fontSize: '1.1rem',
                        lineHeight: 1.6,
                        color: '#333',
                    }}
                >
                    I’m Rajkaran – a developer, educator, and AI enthusiast. This project merges my passion
                    for tech and learning. Ask questions, get answers, and explore knowledge interactively.
                </Typography>
            </Container>
        </Box>
    );
}



