import { Container } from '@mui/material';
import ChatBox from '../components/ChatBox';

export default function Home() {
    return (
        <Container
            disableGutters
            maxWidth={false}
            sx={{ width: '100%' }}
        >
            <ChatBox />
        </Container>
    );
}