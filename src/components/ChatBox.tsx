import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


type PromptPair = { question: string; answer: string };

export default function ChatBox() {
    const [messages, setMessages] = useState<PromptPair[]>([]);
    const [loading, setLoading] = useState(false);

    const userEmail = 'demo@example.com';

    useEffect(() => {
        // Fetch history
        fetch(`${BACKEND_URL}/prompts/by-email?email=${userEmail}`)
            .then((res) => res.json())
            .then(setMessages)
            .catch(console.error);
    }, []);

    const handleSend = async (question: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/prompts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: question, user_id: userEmail }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { question, answer: data }]);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            width="100vw"
            // px={{ xs: 2, sm: 3, md: 6 }}
            py={4}
        >
            <Box
                width="100%"
                maxWidth={{
                    xs: '100%',
                    sm: '100%',
                    md: '100%',
                    lg: '100%',
                    xl: '1200px',
                }}
            >
                <Typography variant="h5" gutterBottom>
                    Portfolio Chat Assistant
                </Typography>

                {messages.map((msg, i) => (
                    <ChatMessage key={i} question={msg.question} answer={msg.answer} />
                ))}

                <ChatInput onSend={handleSend} disabled={loading} />
            </Box>
        </Box>
    );
}
