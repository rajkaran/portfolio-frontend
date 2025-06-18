import { Container } from '@mui/material';
import ChatBox from '../components/ChatBox';

export default function Home() {
    return (
        <Container
            disableGutters
            maxWidth={false}
        >
            <ChatBox />
        </Container>
    );
}