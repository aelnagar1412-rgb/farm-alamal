
import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Livestock';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Treasury from './pages/Treasury';
import Vaccinations from './pages/Vaccinations';
import AiAssistant from './components/AiAssistant';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import MobileSync from './pages/MobileSync';
import AnimalTypes from './pages/CattleBreeds';

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/livestock" element={<Animals />} />
          <Route path="/cattle-breeds" element={<AnimalTypes />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vaccinations" element={<Vaccinations />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/mobile-sync" element={<MobileSync />} />
        </Routes>
        <div id="ai-assistant-container">
          <AiAssistant />
        </div>
      </Layout>
    </HashRouter>
  );
}

export default App;
