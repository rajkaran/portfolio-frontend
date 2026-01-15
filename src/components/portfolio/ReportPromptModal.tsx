import { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextareaAutosize } from '@mui/material';
import { useSnackbar } from '../common/SnackbarProvider';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 360,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

type Props = {
  open: boolean;
  promptId: string;
  onClose: () => void;
  onActionSuccess: (action: 'like' | 'dislike' | 'report') => void;
};

export default function ReportPromptModal({ open, promptId, onClose, onActionSuccess }: Props) {
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (!open) {
      setReportReason('');
    }
  }, [open]);

  const handleReportAction = async () => {
    try {
      setLoading(true);

      const response = await axios.patch(`${BACKEND_URL}/prompts/action/${promptId}`, {
        action: 'report',
        reason: reportReason,
      });

      onActionSuccess(response.data);
      onClose();
    } catch (error) {
      showSnackbar('Failed to save the action. Please try again later or contact admin.', {
        severity: 'error',
        showCloseButton: true,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" mb={2}>
          Report Prompt
        </Typography>
        <TextareaAutosize
          placeholder="Describe your reason..."
          minRows={1}
          maxRows={4}
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
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
        <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => handleReportAction()}
            disabled={!reportReason || loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
