import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SupabaseWarning from '../components/SupabaseWarning';
import ConfirmDialog from '../components/ConfirmDialog';
import { useWorkflowStorage } from '../hooks/useWorkflowStorage';
import { useToast } from '../context/ToastContext';
import { Trash2, Play, Edit, Calendar, GitBranch } from 'lucide-react';
import {
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  CONFIRM_MESSAGES,
  CONFIRM_DIALOG
} from '../constants/appConstants';
import './SavedWorkflows.css';

const SavedWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    workflowId: null,
    workflowName: '',
  });
  const navigate = useNavigate();
  const { loadAllWorkflows, deleteWorkflow, isLoading } = useWorkflowStorage();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    const result = await loadAllWorkflows();
    if (result.success) {
      setWorkflows(result.data || []);
    } else {
      showError(ERROR_MESSAGES.WORKFLOW_LOAD_ALL_FAILED);
      console.error('Error loading workflows:', result.error);
    }
  };

  const handleDelete = async (id, name) => {
    setConfirmDialog({
      isOpen: true,
      workflowId: id,
      workflowName: name,
    });
  };

  const confirmDelete = async () => {
    const { workflowId, workflowName } = confirmDialog;

    const result = await deleteWorkflow(workflowId);
    if (result.success) {
      setWorkflows(workflows.filter((w) => w.id !== workflowId));
      showSuccess(SUCCESS_MESSAGES.WORKFLOW_DELETED);
    } else {
      showError(ERROR_MESSAGES.WORKFLOW_DELETE_FAILED);
      console.error('Error deleting workflow:', result.error);
    }

    setConfirmDialog({ isOpen: false, workflowId: null, workflowName: '' });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, workflowId: null, workflowName: '' });
  };

  const handleEdit = (id) => {
    navigate(`/builder/${id}`);
  };

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <Navbar />
      <SupabaseWarning />
      <div className="saved-workflows-container">
        <div className="saved-workflows-header">
          <h1>Workflows</h1>
          <p>Manage and organize your workflow pipelines</p>
        </div>

        <div className="saved-workflows-controls">
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <Link to="/builder" className="cta-button">
            Create New Workflow
          </Link>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading workflows...</p>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="empty-state">
            <GitBranch size={64} />
            <h2>No workflows found</h2>
            <p>
              {searchQuery
                ? 'No workflows match your search criteria'
                : 'Create your first workflow to get started'}
            </p>
            <Link to="/builder" className="cta-button">
              Create Workflow
            </Link>
          </div>
        ) : (
          <div className="workflows-grid">
            {filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="workflow-card">
                <div className="workflow-card-header">
                  <h3>{workflow.name}</h3>
                  <div className="workflow-card-actions">
                    <button
                      onClick={() => handleEdit(workflow.id)}
                      className="icon-button edit-button"
                      title="Edit workflow"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id, workflow.name)}
                      className="icon-button delete-button"
                      title="Delete workflow"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {workflow.description && (
                  <p className="workflow-description">{workflow.description}</p>
                )}

                <div className="workflow-stats">
                  <div className="workflow-stat">
                    <GitBranch size={16} />
                    <span>{(workflow.nodes || []).length} nodes</span>
                  </div>
                  <div className="workflow-stat">
                    <Play size={16} />
                    <span>{(workflow.edges || []).length} connections</span>
                  </div>
                </div>

                <div className="workflow-footer">
                  <div className="workflow-date">
                    <Calendar size={14} />
                    <span>
                      {formatDate(workflow.updated_at || workflow.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEdit(workflow.id)}
                    className="workflow-open-button"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDelete}
        title={CONFIRM_DIALOG.DELETE_TITLE}
        message={CONFIRM_MESSAGES.DELETE_WORKFLOW(confirmDialog.workflowName)}
        confirmText={CONFIRM_DIALOG.DELETE_CONFIRM_TEXT}
        cancelText={CONFIRM_DIALOG.CANCEL_TEXT}
        variant="danger"
      />
    </div>
  );
};

export default SavedWorkflows;
