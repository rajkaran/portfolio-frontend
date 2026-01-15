import { useState, useRef, useEffect } from 'react';
import { Typography, Box, IconButton, Stack } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ReportIcon from '@mui/icons-material/Report';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import type { User } from '../../types/portfolio/user.types';
import ReportPromptModal from './ReportPromptModal';
import axios from 'axios';
import { useSnackbar } from '../shared/SnackbarProvider';

type Props = {
    id: string;
    question: string;
    answer: string;
    action: 'like' | 'dislike' | 'report' | null;
    user: User;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ChatMessage({ id, question, answer, action, user }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [userAction, setUserAction] = useState<string | null>(action);
    const [showReportModal, setShowReportModal] = useState(false);
    const { showSnackbar } = useSnackbar();

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setIsOverflowing(contentRef.current.scrollHeight > 300);
        }
    }, [answer]);

    const handleBasicActions = async (action: 'like' | 'dislike' | 'report') => {
        try {
            const response = await axios.patch(
                `${BACKEND_URL}/prompts/action/${id}`,
                { action: action }
            );

            setUserAction(response.data);
        } catch (error) {
            showSnackbar('Failed to save the action. Please try again later or contact admin.', {
                severity: 'error',
                showCloseButton: true,
                duration: 5000,
            });
        }
    };

    const handleReportAction = async (action: 'like' | 'dislike' | 'report') => {
        setShowReportModal(false);
        setUserAction(action);
    };

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
                        {user.displayName}
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
                    {userAction && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -14,
                                right: -14,
                                width: 32,
                                height: 32,
                                backgroundColor: '#fff',
                                borderRadius: '50%',
                                border: '2px solid #ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                                boxSizing: 'border-box',
                            }}
                        >
                            {userAction === 'like' && <ThumbUpIcon fontSize="small" color="primary" />}
                            {userAction === 'dislike' && <ThumbDownIcon fontSize="small" color="error" />}
                            {userAction === 'report' && <ReportIcon fontSize="small" color="warning" />}
                        </Box>
                    )}

                    <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        mb={0.5}
                        sx={{ px: 2, pt: 1.5 }}
                    >
                        Anzo
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
            <Box display="flex" justifyContent="flex-end" mt={1} pr={{ xs: '5%', md: '20%' }}>
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" aria-label="Like" onClick={() => handleBasicActions('like')}>
                        <ThumbUpIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="Dislike" onClick={() => handleBasicActions('dislike')}>
                        <ThumbDownIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="Report" onClick={() => setShowReportModal(true)}>
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
            </Box>

            <ReportPromptModal
                open={showReportModal}
                promptId={id}
                onClose={() => setShowReportModal(false)}
                onActionSuccess={handleReportAction}
            />
        </Box>
    );
}
