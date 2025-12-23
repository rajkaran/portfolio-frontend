import { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
} from '@mui/material';
import axios from 'axios';
import type { User } from '../../types/portfolio/user.types';
import { useSnackbar } from '../shared/SnackbarProvider';
import { validateEmail } from '../../utils/validation';

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
    onRegisterSuccess: (user: User) => void;
};

export default function RegisterModal({ open, onClose, onRegisterSuccess }: Props) {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();
    const [emailError, setEmailError] = useState('');
    const maxNameLength = 30;

    useEffect(() => {
        if (!open) {
            setEmail('');
            setDisplayName('');
        }
    }, [open]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (!validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    const handleRegister = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${BACKEND_URL}/users`, { email, displayName });
            onRegisterSuccess(response.data);
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
                    Register
                </Typography>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    error={!!emailError}
                    helperText={emailError || ''}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    slotProps={{ input: { inputProps: { maxLength: maxNameLength } } }}
                    helperText={`${displayName.length}/${maxNameLength} characters`}
                />
                <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={handleRegister}
                    disabled={loading || !!emailError || !email || !displayName}
                >
                    {loading ? 'Registering...' : 'Register'}
                </Button>
            </Box>
        </Modal>
    );
}
