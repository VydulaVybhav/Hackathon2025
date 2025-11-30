import React from 'react';
import { Save } from 'lucide-react';
import { BUTTON_TEXT, PLACEHOLDERS } from '../../constants/appConstants';
import PropTypes from 'prop-types';

const SaveWorkflowDialog = ({
  isOpen,
  onClose,
  onSave,
  workflowName,
  setWorkflowName,
  nodeCount,
  edgeCount,
  isSaving
}) => {
  if (!isOpen) return null;

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="wb-modal-title">Save Workflow</h2>
        <div className="wb-modal-content">
          <div className="wb-config-field">
            <label className="wb-config-label">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="wb-config-input"
              placeholder={PLACEHOLDERS.WORKFLOW_NAME}
              autoFocus
            />
          </div>
          <div className="wb-modal-info">
            <p>Nodes: {nodeCount} | Connections: {edgeCount}</p>
          </div>
        </div>
        <div className="wb-modal-actions">
          <button
            onClick={onClose}
            className="wb-button wb-settings-button"
          >
            {BUTTON_TEXT.CANCEL}
          </button>
          <button
            onClick={onSave}
            disabled={!workflowName.trim() || isSaving}
            className="wb-button wb-execute-button"
          >
            <Save size={16} />
            <span>{isSaving ? BUTTON_TEXT.SAVING : BUTTON_TEXT.SAVE}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

SaveWorkflowDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  workflowName: PropTypes.string.isRequired,
  setWorkflowName: PropTypes.func.isRequired,
  nodeCount: PropTypes.number.isRequired,
  edgeCount: PropTypes.number.isRequired,
  isSaving: PropTypes.bool.isRequired,
};

export default SaveWorkflowDialog;
