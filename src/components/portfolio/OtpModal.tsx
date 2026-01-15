import { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from '../common/SnackbarProvider';

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
  onClose: () => void;
  onOtpSuccess: (status: boolean) => void;
};

export default function RegisterModal({ open, onClose, onOtpSuccess }: Props) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const otpLength = 6;

  useEffect(() => {
    if (!open) {
      setOtp('');
    }
  }, [open]);

  const handleOtpValidate = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/otps/is-valid/${otp}`);
      onOtpSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      showSnackbar('Registration failed. Please try again later or contact admin.', {
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
        <Typography variant="h6" gutterBottom>
          Validate OTP
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          label="OTP passcode"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          slotProps={{ input: { inputProps: { length: otpLength } } }}
        />
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleOtpValidate}
          disabled={loading || !otp || otp.length !== otpLength}
        >
          {loading ? 'Validating...' : 'Validate'}
        </Button>
      </Box>
    </Modal>
  );
}
