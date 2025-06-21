// ChatIntro.tsx
import { Box, Typography } from '@mui/material';

export default function ChatIntro() {

    return (
        <Box display="flex" justifyContent="flex-end" mb={4}>
            <Box>

                <Typography variant="body1" sx={{ pb: 2 }}>
                    👋 Hello, I’m <strong>Anzo</strong> — Rajkaran’s AI Assistant!
                </Typography>

                <Typography variant="body1" sx={{ pb: 2 }}>
                    Rajkaran has trained me with insights from his career journey, and I’m here to speak on
                    his behalf. I can only respond to topics he has shared with me, so feel free to ask anything
                    about him!
                </Typography>

                <Typography variant="body1" sx={{ pb: 2 }}>
                    You're welcome to like, dislike, or report my answers — this helps Rajkaran understand
                    how I’m doing and where I might be falling short.
                </Typography>

                <Typography variant="body1" sx={{ pb: 2 }}>To start chatting, just register with your email.
                    I’ll send you a one-time code to verify it. Once confirmed, you’ll receive a quota of
                    <strong> 30 questions</strong> that you can ask me anytime in the next
                    <strong> 24 hours</strong>.
                </Typography>

                <Typography variant="body1" sx={{ pb: 2 }}>Your email shows Rajkaran you're genuinely
                    interested, and it also allows him to review our conversation and improve what I know.
                </Typography>

                <Typography variant="body1" sx={{ pb: 2 }}>Thanks for talking to me — and for your curiosity
                    about Rajkaran!
                </Typography>

            </Box>
        </Box>
    );
}
