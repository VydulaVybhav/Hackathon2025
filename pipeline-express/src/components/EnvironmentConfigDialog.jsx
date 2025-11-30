import React, { useState } from 'react';
import { X, Plus, Trash2, Globe, Save } from 'lucide-react';
import { useEnvironment } from '../context/EnvironmentContext';
import { configService } from '../services/configService';
import './EnvironmentConfigDialog.css';

/**
 * EnvironmentConfigDialog - Manage default configurations for all environments
 * Accessed via button on top-left. Allows adding custom environments and setting defaults.
 */
const EnvironmentConfigDialog = ({ isOpen, onClose, nodes }) => {
  const { currentEnv, setCurrentEnv, availableEnvs, addEnvironment, removeEnvironment } = useEnvironment();
  const [newEnvName, setNewEnvName] = useState('');
  const [selectedEnv, setSelectedEnv] = useState(currentEnv);
  const [isSaving, setIsSaving] = useState(false);

  // State to track config changes
  const [templateConfigs, setTemplateConfigs] = useState({});

  // Initialize template configs from nodes when dialog opens or nodes change
  React.useEffect(() => {
    if (isOpen) {
      const configs = nodes.reduce((acc, node) => {
        const templateType = node.data.templateType || node.data.type;
        if (!acc[templateType]) {
          acc[templateType] = {
            label: node.data.label,
            parameters: node.data._parameters || [],
            configs: node.data.env_configs || {},
          };
        }
        return acc;
      }, {});
      setTemplateConfigs(configs);
    }
  }, [isOpen, nodes]);

  const handleAddEnvironment = () => {
    if (newEnvName && !availableEnvs.includes(newEnvName.toLowerCase())) {
      addEnvironment(newEnvName.toLowerCase());
      setNewEnvName('');
    }
  };

  const handleRemoveEnvironment = (env) => {
    // Don't allow removing the currently selected environment
    if (env === currentEnv) {
      alert(`Cannot remove the currently active environment (${env}). Switch to another environment first.`);
      return;
    }
    removeEnvironment(env);
  };

  const handleSaveDefaults = async () => {
    setIsSaving(true);
    try {
      // Save all template configs to database
      for (const [templateType, templateData] of Object.entries(templateConfigs)) {
        await configService.saveAllTemplateConfigs(templateType, templateData.configs);
      }
      alert('Default configurations saved successfully!');
    } catch (error) {
      console.error('Failed to save defaults:', error);
      alert('Error saving defaults: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle config field change
  const handleConfigChange = (templateType, paramName, value) => {
    setTemplateConfigs(prev => ({
      ...prev,
      [templateType]: {
        ...prev[templateType],
        configs: {
          ...prev[templateType].configs,
          [selectedEnv]: {
            ...prev[templateType].configs[selectedEnv],
            [paramName]: value
          }
        }
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="env-config-dialog-overlay" onClick={onClose}>
      <div className="env-config-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="env-config-header">
          <div className="env-config-title">
            <Globe size={24} />
            <h2>Environment Configuration Defaults</h2>
          </div>
          <button className="env-config-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="env-config-content">
          {/* Environment Management Section */}
          <div className="env-config-section">
            <h3>Environments</h3>
            <p className="env-config-description">
              Manage your deployment environments. Nodes load with these default configs, but you can override them per-run.
            </p>

            <div className="env-list">
              {availableEnvs.map((env) => (
                <div key={env} className={`env-item ${env === selectedEnv ? 'active' : ''}`}>
                  <button
                    className="env-item-name"
                    onClick={() => setSelectedEnv(env)}
                  >
                    <span className="env-badge" style={{
                      backgroundColor: env === currentEnv ? 'var(--primary-color)' : '#666'
                    }} />
                    {env.toUpperCase()}
                    {env === currentEnv && <span className="env-current-badge">CURRENT</span>}
                  </button>
                  {!['dev', 'staging', 'prod'].includes(env) && (
                    <button
                      className="env-item-delete"
                      onClick={() => handleRemoveEnvironment(env)}
                      title="Remove environment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="env-add-form">
              <input
                type="text"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                placeholder="New environment name (e.g., qa, demo)"
                className="env-add-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddEnvironment()}
              />
              <button
                onClick={handleAddEnvironment}
                className="env-add-button"
                disabled={!newEnvName}
              >
                <Plus size={16} />
                Add Environment
              </button>
            </div>
          </div>

          {/* Default Configs Section */}
          <div className="env-config-section">
            <h3>Default Configurations for: {selectedEnv.toUpperCase()}</h3>
            <p className="env-config-description">
              Set default values that nodes will load with. Users can override these during workflow execution.
            </p>

            {Object.keys(templateConfigs).length === 0 ? (
              <div className="env-config-empty">
                <p>No nodes in workflow yet. Add some modules to configure defaults.</p>
              </div>
            ) : (
              <div className="env-config-templates">
                {Object.entries(templateConfigs).map(([templateType, templateData]) => (
                  <div key={templateType} className="env-config-template">
                    <h4>{templateData.label}</h4>
                    <div className="env-config-fields">
                      {templateData.parameters.map((param) => {
                        const currentValue = templateData.configs[selectedEnv]?.[param.name] || '';
                        const defaultValue = param.default || param.defaultValue || '';

                        return (
                          <div key={param.name} className="env-config-field">
                            <label>{param.name}</label>
                            <input
                              type="text"
                              value={currentValue}
                              placeholder={defaultValue}
                              onChange={(e) => handleConfigChange(templateType, param.name, e.target.value)}
                              className="env-config-input"
                            />
                            {param.description && (
                              <span className="env-config-hint">{param.description}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="env-config-footer">
          <button
            className="env-config-button secondary"
            onClick={() => setCurrentEnv(selectedEnv)}
          >
            <Globe size={16} />
            Switch to {selectedEnv.toUpperCase()}
          </button>
          <button
            className="env-config-button primary"
            onClick={handleSaveDefaults}
            disabled={isSaving || Object.keys(templateConfigs).length === 0}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Defaults'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentConfigDialog;
