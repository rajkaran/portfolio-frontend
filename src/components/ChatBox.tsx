import { useEffect, useState } from 'react';
import { Box, Stack, Button } from '@mui/material';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatIntro from './ChatIntro';
import RegisterModal from './RegisterModal';
import OtpModal from './OtpModal';
import type { User } from '../types/user.types';
import type { PromptHistory, PromptPair } from '../types/prompt.types';
import { setItem, getItem } from '../utils/localStorage';
import { useSnackbar } from './SnackbarProvider';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ChatBox() {
    const [messages, setMessages] = useState<PromptPair[]>([]);
    const [loading, setLoading] = useState(false);
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const { showSnackbar } = useSnackbar();

    const [isRegistered, setIsRegistered] = useState<boolean>(() => {
        return getItem('isRegistered') === 'true';
    });
    const [showOnlyLatest, setShowOnlyLatest] = useState<boolean>(() => {
        return localStorage.getItem('showOnlyLatest') === 'true';
    });
    const [registeredUser, setRegisteredUser] = useState<User | null>(() => {
        return getItem<User>('registeredUser');
    });

    useEffect(() => {
        if (!isRegistered) return;

        // Fetch history
        fetch(`${BACKEND_URL}/prompts/user-id/${registeredUser?.id}`)
            .then((res) => res.json())
            .then((promptHistory: PromptHistory[]) => {
                setMessages(
                    promptHistory.map(item => ({
                        id: item.id,
                        question: item.prompt,
                        answer: item.response,
                        userAction: item.userAction,
                    }))
                );
            })
            .catch(console.error);
    }, [isRegistered, registeredUser]);

    const handleSend = async (question: string) => {
        if (!registeredUser) return;

        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/prompts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: question, email: registeredUser?.email }),
            });
            const data: PromptHistory = await res.json();
            console.log('Response from backend:', data, registeredUser);
            setMessages((prev) => [...prev, { id: data.id, question: data.prompt, answer: data.response, userAction: data.userAction }]);

            // Update registeredUser promptsLeft and update localStorage and state
            const updatedUser = {
                ...registeredUser,
                promptsLeft: data.promptsLeft!,
            };
            setRegisteredUser(updatedUser);
            setItem('registeredUser', updatedUser);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleRegisterSuccess = (user: User) => {
        setRegisterModalOpen(false);
        setRegisteredUser(user);
        setItem('registeredUser', user);

        if (user.otpSent) {
            console.log('open another modal to enter OTP');
            setOtpModalOpen(true);
        }
        else {
            // do not need to wait for OTP validation
            setIsRegistered(true);
            setItem('isRegistered', 'true');

            showSnackbar(`Welcome back! ${registeredUser?.displayName}, You have successfully registered.`, {
                severity: 'success',
                showCloseButton: true,
                duration: 3000,
            });
        }
    };

    const handleOtpValidationSuccess = (status: boolean) => {
        setOtpModalOpen(false);

        if (status) {
            setIsRegistered(true);
            setItem('isRegistered', 'true');

            showSnackbar(`Congratulations! ${registeredUser?.displayName}, You have successfully registered.`, {
                severity: 'success',
                showCloseButton: true,
                duration: 3000,
            });
        } else {
            console.error('OTP validation failed');
        }
    };

    const toggleShowOnlyLatest = () => {
        const newVal = !showOnlyLatest;
        setShowOnlyLatest(newVal);
        localStorage.setItem('showOnlyLatest', String(newVal));
    };

    const visibleMessages = showOnlyLatest
        ? messages.slice(-1)
        : messages;

    return (
        <Box
            display="flex"
            justifyContent="center"
            width="100%"
            px={{ xs: 2, sm: 3, md: 6 }}
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
                <ChatIntro />

                {/* Chat Messages */}
                {registeredUser && visibleMessages.map((msg, i) => (
                    <ChatMessage key={i} id={msg.id} question={msg.question} answer={msg.answer} action={msg.userAction} user={registeredUser} />
                ))}

                {/* TODO: Add an down arrow button which will take usr to the input box.*/}

                {/* Action Buttons */}
                <Stack direction="row" justifyContent="flex-end" spacing={2} mb={1}>
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => setRegisterModalOpen(true)}
                    >
                        Register
                    </Button>
                    <Button variant="text" size="small" onClick={toggleShowOnlyLatest}>
                        {showOnlyLatest ? 'Show all interactions' : 'Only show latest'}
                    </Button>
                </Stack>

                <RegisterModal
                    open={registerModalOpen}
                    onClose={() => setRegisterModalOpen(false)}
                    onRegisterSuccess={handleRegisterSuccess}
                />

                <OtpModal
                    open={otpModalOpen}
                    onClose={() => setOtpModalOpen(false)}
                    onOtpSuccess={handleOtpValidationSuccess}
                />

                <ChatInput onSend={handleSend} disabled={loading} promptsLeft={registeredUser?.promptsLeft || 0} />
            </Box>
        </Box>
    );
}
