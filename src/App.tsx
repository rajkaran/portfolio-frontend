import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/stock/Dashboard';
import GroceryList from './pages/grocery/GroceryList';
import Setting from './pages/stock/Setting';
import Ticker from './pages/stock/Ticker';
import Trade from './pages/stock/Trade';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/stock" element={<Dashboard />} />
        <Route path="/stock/setting" element={<Setting />} />
        <Route path="/stock/ticker" element={<Ticker />} />
        <Route path="/stock/trade" element={<Trade />} />

        <Route path="/grocery" element={<GroceryList />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
