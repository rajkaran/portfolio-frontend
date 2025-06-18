import { useState } from 'react';
import { Box, IconButton, CircularProgress } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SendIcon from '@mui/icons-material/Send';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Paper from '@mui/material/Paper';

type Props = {
    onSend: (text: string) => void;
    disabled?: boolean;
};

export default function ChatInput({ onSend, disabled }: Props) {
    const [text, setText] = useState('');

    const trimmed = text.trim();
    const hasContent = trimmed.length > 0;

    const handleSend = () => {
        if (hasContent) {
            onSend(trimmed);
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // prevent newline
            handleSend();
        }
    };

    return (
        <Box mt={3} mb={2} display="flex" justifyContent="center" >
            <Box width="100%" >
                <Paper
                    elevation={2}
                    sx={{
                        borderRadius: '16px',
                        padding: '12px',
                        backgroundColor: '#f7f7f8',
                    }}
                >
                    <TextareaAutosize
                        placeholder="Ask me anything..."
                        minRows={1}
                        maxRows={6}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            backgroundColor: 'transparent',
                            padding: '4px',
                            lineHeight: 1.5,
                        }}
                    />

                    <Box display="flex" justifyContent="flex-end" mt={1}>
                        {disabled ? (
                            <CircularProgress size={28} />
                        ) : (
                            <IconButton
                                onClick={handleSend}
                                disabled={!hasContent}
                                sx={{
                                    backgroundColor: hasContent ? '#000' : '#e0e0e0',
                                    color: hasContent ? '#fff' : '#888',
                                    '&:hover': {
                                        backgroundColor: hasContent ? '#333' : '#d0d0d0',
                                    },
                                    borderRadius: '12px',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                {hasContent ? <ArrowUpwardIcon /> : <SendIcon />}
                            </IconButton>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
