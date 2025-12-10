import React, { useState } from 'react';
import { Trash2, Settings, Globe, Code2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEnvironment } from '../../context/EnvironmentContext';
import { CodeEditorModal } from '../CodeEditor';
import './ConfigPanel.css';

/**
 * ConfigPanel - Per-run configuration editor
 * Uses ADO template parameters as source of truth for fields
 * Changes here are per-run overrides, not saved to defaults
 */
const ConfigPanel = ({ selectedNode, onDelete, onUpdateConfig }) => {
  const { currentEnv } = useEnvironment();
  const [codeEditorState, setCodeEditorState] = useState({
    isOpen: false,
    paramName: '',
    value: '',
    language: 'yaml',
  });

  if (!selectedNode) return null;

  // Get template parameters (from ADO)
  const templateParameters = selectedNode.data._parameters || [];

  // Get environment configs
  const envConfigs = selectedNode.data.env_configs || {
    dev: {},
    staging: {},
    prod: {},
  };

  // Get current environment's config
  const currentConfig = envConfigs[currentEnv] || {};

  // Environment metadata for display
  const envMetadata = {
    dev: { label: 'Development', color: '#00ff9f', icon: '🔧' },
    staging: { label: 'Staging', color: '#ffd700', icon: '🧪' },
    prod: { label: 'Production', color: '#ff0080', icon: '🚀' },
  };

  /**
   * Handle config field change (per-run override, not saved to database)
   */
  const handleFieldChange = (paramName, value) => {
    // Update only the current environment config for this specific node instance
    // This is a per-run override and won't be saved to database defaults
    onUpdateConfig(selectedNode.id, currentEnv, { [paramName]: value });
  };

  /**
   * Detect language for code editor based on parameter name or value
   */
  const detectLanguage = (paramName, value) => {
    const name = paramName.toLowerCase();
    const val = (value || '').trim();

    // Check by parameter name
    if (name.includes('yaml') || name.includes('yml')) return 'yaml';
    if (name.includes('json')) return 'json';
    if (name.includes('python') || name.includes('py') || name.includes('script')) return 'python';
    if (name.includes('bash') || name.includes('shell') || name.includes('sh')) return 'bash';
    if (name.includes('powershell') || name.includes('ps1')) return 'powershell';
    if (name.includes('javascript') || name.includes('js')) return 'javascript';
    if (name.includes('typescript') || name.includes('ts')) return 'typescript';
    if (name.includes('sql')) return 'sql';

    // Check by value content
    if (val.startsWith('{') || val.startsWith('[')) return 'json';
    if (val.includes('#!/bin/bash') || val.includes('#!/bin/sh')) return 'bash';
    if (val.includes('def ') || val.includes('import ')) return 'python';

    // Default to YAML for multi-line content
    return val.includes('\n') ? 'yaml' : 'text';
  };

  /**
   * Open code editor for a parameter
   */
  const openCodeEditor = (paramName, value) => {
    setCodeEditorState({
      isOpen: true,
      paramName,
      value: value || '',
      language: detectLanguage(paramName, value),
    });
  };

  /**
   * Save code editor changes
   */
  const handleCodeEditorSave = (newValue) => {
    handleFieldChange(codeEditorState.paramName, newValue);
    setCodeEditorState({ isOpen: false, paramName: '', value: '', language: 'yaml' });
  };

  /**
   * Close code editor without saving
   */
  const closeCodeEditor = () => {
    setCodeEditorState({ isOpen: false, paramName: '', value: '', language: 'yaml' });
  };

  /**
   * Render config fields for the current environment only
   */
  const renderCurrentEnvFields = () => {
    if (!templateParameters || templateParameters.length === 0) {
      return (
        <div className="wb-config-empty">
          <p>No configurable parameters for this module.</p>
        </div>
      );
    }

    return (
      <div className="wb-config-fields">
        <div className="wb-config-env-header" style={{ borderColor: envMetadata[currentEnv].color }}>
          <Globe size={16} style={{ color: envMetadata[currentEnv].color }} />
          <span>
            {envMetadata[currentEnv].icon} <strong>{envMetadata[currentEnv].label}</strong>
          </span>
        </div>
        <div className="wb-config-note">
          💡 Changes here are for this run only. Set defaults via Environment Config button (top-left).
        </div>

        {templateParameters.map((param) => {
          const paramName = param.name;
          const paramValue = currentConfig[paramName] || '';
          const paramDefault = param.default || param.defaultValue || '';
          const paramDescription = param.description || '';

          return (
            <div key={paramName} className="wb-config-field">
              <label className="wb-config-label">
                {paramName}
                {paramDescription && (
                  <span className="wb-config-description" title={paramDescription}>
                    ℹ️
                  </span>
                )}
              </label>
              <div className="wb-config-input-group">
                <input
                  type="text"
                  value={paramValue}
                  placeholder={paramDefault}
                  onChange={(e) => handleFieldChange(paramName, e.target.value)}
                  className="wb-config-input"
                />
                <button
                  onClick={() => openCodeEditor(paramName, paramValue)}
                  className="wb-config-code-btn"
                  title="Open in code editor"
                  type="button"
                >
                  <Code2 size={16} />
                </button>
              </div>
              {paramDefault && !paramValue && (
                <span className="wb-config-hint">Default: {paramDefault}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="wb-config-panel">
        <div className="wb-config-header">
          <h3 className="wb-config-title">
            <Settings size={18} />
            Module Config
          </h3>
          <button onClick={onDelete} className="wb-delete-button" title="Delete node">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Module Info */}
        <div className="wb-config-module-info">
          <div className="wb-config-field">
            <label className="wb-config-label">Module Type</label>
            <div className="wb-config-readonly">
              {selectedNode.data.label}
            </div>
          </div>
          {selectedNode.data.description && (
            <div className="wb-config-field">
              <label className="wb-config-label">Description</label>
              <div className="wb-config-readonly small">
                {selectedNode.data.description}
              </div>
            </div>
          )}
        </div>

        {/* Config Fields */}
        {renderCurrentEnvFields()}
      </div>

      {/* Code Editor Modal */}
      <CodeEditorModal
        isOpen={codeEditorState.isOpen}
        onClose={closeCodeEditor}
        initialValue={codeEditorState.value}
        onSave={handleCodeEditorSave}
        language={codeEditorState.language}
        title={`Edit ${codeEditorState.paramName}`}
        readOnly={false}
      />
    </>
  );
};

ConfigPanel.propTypes = {
  selectedNode: PropTypes.shape({
    id: PropTypes.string.isRequired,
    data: PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      config: PropTypes.object,
      _parameters: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          default: PropTypes.any,
          defaultValue: PropTypes.any,
          description: PropTypes.string,
        })
      ),
      env_configs: PropTypes.object,
    }).isRequired,
  }),
  onDelete: PropTypes.func.isRequired,
  onUpdateConfig: PropTypes.func.isRequired,
};

export default ConfigPanel;
