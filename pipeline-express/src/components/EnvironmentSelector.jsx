import React from 'react';
import { useEnvironment } from '../context/EnvironmentContext';
import '../styles/EnvironmentSelector.css';

/**
 * Environment Selector Component
 * Dropdown to switch between dev, staging, and production environments
 */
const EnvironmentSelector = () => {
  const { currentEnv, setCurrentEnv, availableEnvs } = useEnvironment();

  // Environment display metadata
  const envMetadata = {
    dev: {
      label: 'Development',
      color: '#00ff9f',
      icon: '🔧',
    },
    staging: {
      label: 'Staging',
      color: '#ffd700',
      icon: '🧪',
    },
    prod: {
      label: 'Production',
      color: '#ff0080',
      icon: '🚀',
    },
  };

  return (
    <div className="environment-selector">
      <label className="env-label">Environment:</label>
      <div className="env-select-wrapper">
        <select
          value={currentEnv}
          onChange={(e) => setCurrentEnv(e.target.value)}
          className="env-select"
          style={{
            borderColor: envMetadata[currentEnv]?.color || '#00ff9f',
          }}
        >
          {availableEnvs.map((env) => (
            <option key={env} value={env}>
              {envMetadata[env]?.icon || ''} {envMetadata[env]?.label || env.toUpperCase()}
            </option>
          ))}
        </select>
        <div
          className="env-indicator"
          style={{
            backgroundColor: envMetadata[currentEnv]?.color || '#00ff9f',
          }}
          title={`Currently configuring for ${envMetadata[currentEnv]?.label || currentEnv}`}
        />
      </div>
    </div>
  );
};

export default EnvironmentSelector;
