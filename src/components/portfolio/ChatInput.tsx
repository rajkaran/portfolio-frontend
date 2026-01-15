import { useState } from 'react';
import { Box, IconButton, CircularProgress } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SendIcon from '@mui/icons-material/Send';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Paper from '@mui/material/Paper';

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  promptsLeft: number;
};

export default function ChatInput({ onSend, disabled, promptsLeft }: Props) {
  const [text, setText] = useState('');

  const trimmed = text.trim();
  const hasContent = trimmed.length > 0;
  const maxNPromptLength = 400;
  const charactersLeft = maxNPromptLength - trimmed.length;

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
    <Box mt={3} mb={2} display="flex" justifyContent="center">
      <Box width="100%">
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
            maxLength={maxNPromptLength}
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

          <Box display="flex" alignItems="center" mt={1}>
            {/* Left: Prompts left */}
            <Box flex={1}>
              <span style={{ fontSize: '0.875rem', color: '#888' }}>
                {promptsLeft} questions left
              </span>
            </Box>

            {/* Center: Characters left */}
            <Box flex={1} display="flex" justifyContent="center">
              <span style={{ fontSize: '0.875rem', color: '#888' }}>
                {charactersLeft} characters left
              </span>
            </Box>

            {/* Right aligned: Send button + progress spinner */}
            <Box flex={1} display="flex" justifyContent="flex-end">
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
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
