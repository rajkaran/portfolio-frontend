import { Container } from '@mui/material';
import ChatBox from '../components/portfolio/ChatBox';
import Navbar from '../components/portfolio/Navbar';
import IntroSection from '../components/portfolio/IntroSection';

export default function Home() {
  return (
    <Container disableGutters maxWidth={false} sx={{ width: '100%' }}>
      <Navbar />
      <IntroSection />
      <ChatBox />
    </Container>
  );
}
