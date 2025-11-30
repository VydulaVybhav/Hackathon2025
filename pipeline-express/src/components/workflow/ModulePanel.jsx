import React from 'react';
import { Plus } from 'lucide-react';
import { LOADING_MESSAGES } from '../../constants/appConstants';
import PropTypes from 'prop-types';

const ModulePanel = ({
  modules,
  moduleSource,
  moduleError,
  isLoadingModules,
  hoveredTemplate,
  setHoveredTemplate,
  onAddNode
}) => {
  return (
    <div className="wb-templates-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 className="wb-templates-title">System Modules</h2>
        {moduleSource && (
          <span style={{ fontSize: '10px', color: 'var(--primary-color)', textTransform: 'uppercase', fontWeight: 'bold' }}>
            {isLoadingModules ? LOADING_MESSAGES.MODULES : 'ADO'}
          </span>
        )}
      </div>

      {moduleError && (
        <div className="wb-error-message">
          <div className="wb-error-title">
            ⚠️ ADO Connection Failed
          </div>
          <div className="wb-error-content">
            {moduleError}
          </div>
          <div className="wb-error-hint">
            Configure Azure DevOps environment variables to load modules.
            <br />See ADO_MODULES_GUIDE.md for setup instructions.
          </div>
        </div>
      )}

      {!moduleError && modules.length === 0 && !isLoadingModules && (
        <div className="wb-warning-message">
          <div className="wb-warning-title">
            📦 No Modules Found
          </div>
          <div className="wb-warning-content">
            No module YAML files found in ADO repository.
            <br />Add YAML files to the configured modules path.
          </div>
        </div>
      )}

      <div className="wb-templates-list">
        {modules.map((template, index) => {
          const Icon = template.icon;
          const isHovered = hoveredTemplate === index;
          return (
            <button
              key={index}
              onClick={() => onAddNode(template)}
              onMouseEnter={() => setHoveredTemplate(index)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className="wb-node-template"
              disabled={isLoadingModules}
            >
              <Icon size={20} style={{ color: 'var(--primary-color)' }} />
              <div className="wb-node-template-content">
                <div className="wb-node-template-label">{template.label}</div>
                <div className="wb-node-template-description">{template.description}</div>
              </div>
              <Plus
                size={16}
                style={{ color: 'var(--primary-color)', opacity: isHovered ? 1 : 0.7 }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

ModulePanel.propTypes = {
  modules: PropTypes.array.isRequired,
  moduleSource: PropTypes.string,
  moduleError: PropTypes.string,
  isLoadingModules: PropTypes.bool.isRequired,
  hoveredTemplate: PropTypes.number,
  setHoveredTemplate: PropTypes.func.isRequired,
  onAddNode: PropTypes.func.isRequired,
};

export default ModulePanel;
