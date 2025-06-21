import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type SnackbarOptions = {
    severity?: 'success' | 'info' | 'warning' | 'error';
    duration?: number; // in milliseconds
    showCloseButton?: boolean;
};

type SnackbarContextType = {
    showSnackbar: (message: string, options?: SnackbarOptions) => void;
};

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) throw new Error('useSnackbar must be used within a SnackbarProvider');
    return context;
};

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<SnackbarOptions['severity']>('info');
    const [duration, setDuration] = useState<number | null>(3000);
    const [showClose, setShowClose] = useState(true);

    const showSnackbar = (
        msg: string,
        options?: SnackbarOptions
    ) => {
        setMessage(msg);
        setSeverity(options?.severity || 'info');
        setDuration(options?.duration ?? 3000);
        setShowClose(options?.showCloseButton !== false); // default to true
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={duration ?? null}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={severity}
                    onClose={showClose ? handleClose : undefined}
                    action={
                        showClose && (
                            <IconButton size="small" onClick={handleClose}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )
                    }
                >
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};
