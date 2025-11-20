import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import WorkflowBuilder from './components/WorkflowBuilder';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<WorkflowBuilder />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;