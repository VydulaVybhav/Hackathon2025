import React from 'react';
import { AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
          background: 'var(--bg-gradient)',
          color: 'var(--text-color)'
        }}>
          <AlertTriangle size={64} color="#ff4444" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--primary-color)' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ fontSize: '1.1rem', marginBottom: '20px', opacity: 0.8 }}>
            The application encountered an unexpected error.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'var(--accent-gradient)',
              color: '#0a0f0a',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(255, 59, 48, 0.15)',
              border: '2px solid rgba(255, 59, 48, 0.5)',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
                Error Details (Development Mode)
              </summary>
              <pre style={{
                fontSize: '12px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
