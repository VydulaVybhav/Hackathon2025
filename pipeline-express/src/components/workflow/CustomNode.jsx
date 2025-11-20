import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getStatusColor } from '../../utils/workflowUtils';

const CustomNode = ({ data, selected }) => {
  const Icon = data.icon;

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
      </div>

      <div className="wb-node-body">
        {data.config ? (
          <div className="wb-node-config">
            {Object.entries(data.config).map(([key, value]) => (
              <div key={key} className="wb-node-config-row">
                <span className="wb-node-config-key">{key}:</span>
                <span className="wb-node-config-value">{value}</span>
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
        />
      )}
    </div>
  );
};

export default CustomNode;
