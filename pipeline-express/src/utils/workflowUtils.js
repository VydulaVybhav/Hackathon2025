// Utility functions for workflow operations

export const getStatusColor = (status) => {
  switch (status) {
    case 'success':
      return 'var(--primary-color)';
    case 'error':
      return '#ff4444';
    case 'running':
      return '#ffaa00';
    default:
      return '#666';
  }
};

export const generateNodeId = () => `node_${Date.now()}`;

export const generateRandomPosition = () => ({
  x: Math.random() * 300 + 100,
  y: Math.random() * 200 + 100,
});
