import { useState, useRef, useEffect } from 'react';
import { Typography, Box, IconButton, Stack } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ReportIcon from '@mui/icons-material/Report';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';

type Props = {
    question: string;
    answer: string;
};

export default function ChatMessage({ question, answer }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setIsOverflowing(contentRef.current.scrollHeight > 300);
        }
    }, [answer]);

    return (
        <Box mb={4}>
            {/* Question Bubble */}
            <Box display="flex" justifyContent="flex-start" mb={1}>
                <Paper
                    elevation={1}
                    sx={{
                        px: 2,
                        py: 1.5,
                        maxWidth: { xs: '90%', md: '40%' },
                        backgroundColor: '#e0f7fa',
                        borderRadius: '0 12px 12px 0',
                    }}
                >
                    <Typography variant="subtitle2" color="textSecondary" mb={0.5}>
                        You
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {question}
                    </Typography>
                </Paper>
            </Box>

            {/* Answer Bubble */}
            <Box display="flex" justifyContent="flex-end">
                <Paper
                    elevation={1}
                    sx={{
                        maxWidth: { xs: '90%', md: '60%' },
                        backgroundColor: '#fafafa',
                        borderRadius: '12px 0 0 12px',
                        position: 'relative',
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        mb={0.5}
                        sx={{ px: 2, pt: 1.5 }}
                    >
                        AI
                    </Typography>

                    {/* Collapse button on top if expanded */}
                    <Box
                        ref={contentRef}
                        sx={{
                            overflow: 'hidden',
                            maxHeight: expanded ? 'none' : '300px',
                            position: 'relative',
                            px: 2,
                        }}
                    >
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => (
                                    <Typography
                                        variant="body1"
                                        paragraph
                                        sx={{ whiteSpace: 'pre-line' }}
                                    >
                                        {children}
                                    </Typography>
                                ),
                            }}
                        >
                            {answer}
                        </ReactMarkdown>

                        {/* Overlay if collapsed and overflowing */}
                        {!expanded && isOverflowing && (
                            <Box
                                onClick={() => setExpanded(true)}
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '80px',
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgb(146, 146, 146))',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.3s',
                                    opacity: 0.8,
                                    '&:hover': {
                                        opacity: 1,
                                    },
                                    borderBottomLeftRadius: '12px',
                                    pb: 1.5,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: '#000', fontWeight: 600 }}>
                                    Read more...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* Feedback buttons below the answer */}
            {/* <Box display="flex" justifyContent="flex-end" mt={1} pr={{ xs: '5%', md: '20%' }}>
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" aria-label="Like">
                        <ThumbUpIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="Dislike">
                        <ThumbDownIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="Report">
                        <ReportIcon fontSize="small" />
                    </IconButton>

                    {expanded && (
                        <Tooltip title="Shrink the answer bubble" arrow>
                            <IconButton
                                size="small"
                                aria-label="Collapse"
                                onClick={() => setExpanded(false)}
                            >
                                <ArrowDropDownCircleIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Box> */}
        </Box>
    );
}
