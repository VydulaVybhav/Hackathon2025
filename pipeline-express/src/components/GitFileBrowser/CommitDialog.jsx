import React, { useState } from 'react';
import { GitCommit, X } from 'lucide-react';
import './CommitDialog.css';

const CommitDialog = ({ isOpen, onClose, onCommit, fileName, isLoading }) => {
  const [commitMessage, setCommitMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('CommitDialog handleSubmit', { commitMessage, fileName, isLoading });
    if (commitMessage.trim()) {
      console.log('Calling onCommit with:', commitMessage.trim());
      onCommit(commitMessage.trim());
      setCommitMessage('');
    } else {
      console.warn('Commit message is empty');
    }
  };

  console.log('CommitDialog render', { isOpen, fileName, isLoading, hasCommitMessage: !!commitMessage });

  if (!isOpen) return null;

  return (
    <div className="commit-dialog-overlay" onClick={onClose}>
      <div className="commit-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="commit-dialog-header">
          <div className="commit-dialog-title">
            <GitCommit size={20} />
            <h3>Commit Changes</h3>
          </div>
          <button className="commit-dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="commit-dialog-form">
          <div className="commit-dialog-file">
            <strong>File:</strong> {fileName}
          </div>

          <div className="commit-dialog-field">
            <label htmlFor="commit-message">Commit Message</label>
            <textarea
              id="commit-message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Update module configuration..."
              className="commit-message-input"
              rows={4}
              autoFocus
              required
            />
            <small className="commit-hint">
              Describe what changed and why (required)
            </small>
          </div>

          <div className="commit-dialog-actions">
            <button
              type="button"
              onClick={onClose}
              className="commit-btn commit-btn-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="commit-btn commit-btn-primary"
              disabled={isLoading || !commitMessage.trim()}
            >
              {isLoading ? 'Committing...' : 'Commit & Push'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommitDialog;
