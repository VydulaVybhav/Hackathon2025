import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './BranchSwitchDialog.css';

const BranchSwitchDialog = ({ isOpen, onClose, onConfirm, modifiedCount, newBranch }) => {
  if (!isOpen) return null;

  return (
    <div className="branch-switch-overlay" onClick={onClose}>
      <div className="branch-switch-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="branch-switch-header">
          <div className="branch-switch-title">
            <AlertTriangle size={20} color="#ff9500" />
            <h3>Unsaved Changes</h3>
          </div>
          <button className="branch-switch-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="branch-switch-content">
          <p className="branch-switch-warning">
            You have <strong>{modifiedCount} unsaved file(s)</strong> with changes.
          </p>
          <p className="branch-switch-message">
            Switching to branch <strong>{newBranch}</strong> will close all open tabs and you will lose all unsaved changes.
          </p>
          <p className="branch-switch-hint">
            Consider committing your changes before switching branches.
          </p>
        </div>

        <div className="branch-switch-actions">
          <button className="branch-switch-btn branch-switch-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="branch-switch-btn branch-switch-btn-confirm" onClick={onConfirm}>
            Switch Branch & Lose Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchSwitchDialog;
