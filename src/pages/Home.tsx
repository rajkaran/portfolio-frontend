import { Container } from '@mui/material';
import ChatBox from '../components/ChatBox';
import Navbar from '../components/Navbar';
import IntroSection from '../components/IntroSection';

export default function Home() {
    return (
        <Container
            disableGutters
            maxWidth={false}
            sx={{ width: '100%' }}
        >
            <Navbar />
            <IntroSection />
            <ChatBox />
        </Container>
    );
}