import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/stock/Dashboard';
import GroceryList from './pages/grocery/GroceryList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock" element={<Dashboard />} />
        <Route path="/grocery" element={<GroceryList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* Add future pages here */}
      </Routes>
    </Router>
  );
}

export default App;
