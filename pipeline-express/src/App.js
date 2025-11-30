import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { EnvironmentProvider } from './context/EnvironmentContext';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import Home from './pages/Home';
import WorkflowBuilder from './components/WorkflowBuilder';
import SavedWorkflows from './pages/SavedWorkflows';
import { authService } from './services/authService';
import './index.css';

function App() {
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        setIsAuthInitialized(true);
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        setAuthError(error.message);
      }
    };

    initializeAuth();
  }, []);

  if (!isAuthInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#00ff41'
      }}>
        {authError ? (
          <div style={{ textAlign: 'center' }}>
            <h2>Authentication Failed</h2>
            <p>{authError}</p>
            <p style={{ fontSize: '0.9em', marginTop: '1em', color: '#888' }}>
              Check your service account credentials and proxy configuration.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{
              width: '50px',
              height: '50px',
              border: '3px solid #333',
              borderTop: '3px solid #00ff41',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1em'
            }}></div>
            <p>Initializing authentication...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <EnvironmentProvider>
          <ToastProvider>
            <Router>
              <div className="App">
                <Toast />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/builder" element={<WorkflowBuilder />} />
                  <Route path="/builder/:id" element={<WorkflowBuilder />} />
                  <Route path="/saved-workflows" element={<SavedWorkflows />} />
                </Routes>
              </div>
            </Router>
          </ToastProvider>
        </EnvironmentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;