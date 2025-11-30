import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getStatusColor } from '../../utils/workflowUtils';
import { Box } from 'lucide-react';
import { useEnvironment } from '../../context/EnvironmentContext';

const CustomNode = ({ data, selected }) => {
  const { currentEnv } = useEnvironment();

  // Handle invalid icons (e.g., when loaded from Supabase as objects)
  const Icon = typeof data.icon === 'function' ? data.icon : Box;

  // Get config for current environment
  const currentConfig = data.env_configs?.[currentEnv] || data.config || {};

  // Environment colors for badge
  const envColors = {
    dev: '#00ff9f',
    staging: '#ffd700',
    prod: '#ff0080',
  };

  return (
    <div className={`wb-custom-node ${selected ? 'wb-node-selected' : ''}`}>
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="custom-handle-input"
        />
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="custom-handle-output"
      />

      <div className="wb-node-header">
        <Icon size={20} className="text-primary" style={{ color: 'var(--primary-color)' }} />
        <div className="wb-node-template-content">
          <div className="wb-node-title">{data.label}</div>
          {data.description && (
            <div className="wb-node-description">{data.description}</div>
          )}
        </div>
        {/* Environment badge */}
        <div
          className="wb-node-env-badge"
          style={{ backgroundColor: envColors[currentEnv] }}
          title={`Environment: ${currentEnv.toUpperCase()}`}
        >
          {currentEnv.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="wb-node-body">
        {currentConfig && Object.keys(currentConfig).length > 0 ? (
          <div className="wb-node-config">
            {Object.entries(currentConfig).map(([key, value]) => (
              <div key={key} className="wb-node-config-row">
                <span className="wb-node-config-key">{key}:</span>
                <span className="wb-node-config-value">{value || <em>default</em>}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="wb-node-empty-state">Click to configure</div>
        )}
      </div>

      {data.status && data.status !== 'idle' && (
        <div
          className="wb-status-indicator"
          style={{
            backgroundColor: getStatusColor(data.status),
            ...(data.status === 'running' && {
              animation: 'cyberpunk-pulse 2s ease-in-out infinite',
            }),
          }}
          title={data.error_message || data.status}
        />
      )}

      {data.error_message && (
        <div className="wb-node-error" title={data.error_message}>
          Error: {data.error_message.substring(0, 50)}{data.error_message.length > 50 ? '...' : ''}
        </div>
      )}
    </div>
  );
};

export default CustomNode;
