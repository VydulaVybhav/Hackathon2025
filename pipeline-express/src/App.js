import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import WorkflowBuilder from './components/WorkflowBuilder';
import SavedWorkflows from './pages/SavedWorkflows';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<WorkflowBuilder />} />
            <Route path="/builder/:id" element={<WorkflowBuilder />} />
            <Route path="/saved-workflows" element={<SavedWorkflows />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;