import React from 'react';
import { AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-icon">
          <AlertTriangle size={48} />
        </div>
        <h2 className="wb-modal-title">{title}</h2>
        <div className="wb-modal-content">
          <p className="confirm-dialog-message">{message}</p>
        </div>
        <div className="wb-modal-actions">
          <button
            onClick={onClose}
            className="wb-button wb-settings-button"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`wb-button ${variant === 'danger' ? 'wb-delete-button' : 'wb-execute-button'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning']),
};

ConfirmDialog.defaultProps = {
  variant: 'danger',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
};

export default ConfirmDialog;
