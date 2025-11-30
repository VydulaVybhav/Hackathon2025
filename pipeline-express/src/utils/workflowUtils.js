// Utility functions for workflow operations
import { STATUS_COLORS, NODE_SPAWN_AREA } from '../constants/appConstants';

export const getStatusColor = (status) => {
  switch (status) {
    case 'success':
      return 'var(--primary-color)';
    case 'error':
      return STATUS_COLORS.ERROR;
    case 'running':
      return STATUS_COLORS.RUNNING;
    default:
      return STATUS_COLORS.DEFAULT;
  }
};

export const generateNodeId = () => `node_${Date.now()}`;

export const generateRandomPosition = () => ({
  x: Math.random() * (NODE_SPAWN_AREA.MAX_X - NODE_SPAWN_AREA.MIN_X) + NODE_SPAWN_AREA.MIN_X,
  y: Math.random() * (NODE_SPAWN_AREA.MAX_Y - NODE_SPAWN_AREA.MIN_Y) + NODE_SPAWN_AREA.MIN_Y,
});
