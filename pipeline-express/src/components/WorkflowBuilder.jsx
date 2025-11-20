import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Settings, Trash2, Plus, Home as HomeIcon, Palette, Save, FolderOpen } from 'lucide-react';
import CustomNode from './workflow/CustomNode';
import SupabaseWarning from './SupabaseWarning';
import { useWorkflow } from '../hooks/useWorkflow';
import { useWorkflowStorage } from '../hooks/useWorkflowStorage';
import { useModuleLoader } from '../hooks/useModuleLoader';
import { getStatusColor } from '../utils/workflowUtils';
import './WorkflowBuilder.css';
import Chatbox from './Chatbox';

const nodeTypes = {
  customNode: CustomNode,
};

const WorkflowBuilder = () => {
  const { id } = useParams();
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(id || null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { modules, isLoading: isLoadingModules, error: moduleError, source: moduleSource } = useModuleLoader();
  const {
    nodes,
    edges,
    selectedNode,
    isRunning,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    onNodeClick,
    deleteNode,
    updateNodeConfig,
    executeWorkflow,
    setNodes,
    setEdges,
  } = useWorkflow();
  const { saveWorkflow, updateWorkflow, loadWorkflow, isSaving } = useWorkflowStorage();

  // Load workflow if ID is provided
  useEffect(() => {
    if (id) {
      handleLoadWorkflow(id);
    }
  }, [id]);

  const handleLoadWorkflow = async (workflowId) => {
    const result = await loadWorkflow(workflowId);
    if (result.success && result.data) {
      setNodes(result.data.nodes || []);
      setEdges(result.data.edges || []);
      setWorkflowName(result.data.name || 'Untitled Workflow');
      setCurrentWorkflowId(workflowId);
    }
  };

  const handleSaveWorkflow = async () => {
    const workflow = {
      id: currentWorkflowId,
      name: workflowName,
      description: `Workflow with ${nodes.length} nodes`,
      nodes,
      edges,
    };

    if (currentWorkflowId) {
      const result = await updateWorkflow(currentWorkflowId, workflow);
      if (result.success) {
        alert('Workflow updated successfully!');
      } else {
        alert(`Error: ${result.error || 'Failed to update workflow'}`);
      }
    } else {
      const result = await saveWorkflow(workflow);
      if (result.success && result.data) {
        setCurrentWorkflowId(result.data.id);
        alert('Workflow saved successfully!');
      } else {
        alert(`Error: ${result.error || 'Failed to save workflow'}`);
      }
    }
    setShowSaveDialog(false);
  };

  const edgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'var(--primary-color)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary-color)' },
    }),
    []
  );

  return (
    <div className="wb-container">
      <SupabaseWarning />
      <div className="wb-sidebar">
        <div className="wb-sidebar-header">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <Link
              to="/"
              className="wb-button wb-settings-button"
              style={{ padding: '8px 12px', fontSize: '12px', textDecoration: 'none' }}
            >
              <HomeIcon size={14} />
              <span>Home</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="wb-button wb-settings-button"
              style={{ padding: '8px 12px', fontSize: '12px' }}
              title={`Current theme: ${theme}`}
            >
              <Palette size={14} />
              <span>Theme</span>
            </button>
          </div>
          <h1 className="wb-sidebar-title">Neural Flow</h1>
          <p className="wb-sidebar-subtitle">Build your digital pipeline</p>
        </div>

        <div className="wb-templates-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 className="wb-templates-title">System Modules</h2>
            {moduleSource && (
              <span style={{ fontSize: '10px', color: 'var(--primary-color)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {isLoadingModules ? 'Loading...' : 'ADO'}
              </span>
            )}
          </div>

          {moduleError && (
            <div style={{
              padding: '16px',
              marginBottom: '15px',
              background: 'rgba(255, 59, 48, 0.15)',
              border: '2px solid rgba(255, 59, 48, 0.5)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ff453a'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
                ⚠️ ADO Connection Failed
              </div>
              <div style={{ marginBottom: '8px', lineHeight: '1.4' }}>
                {moduleError}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>
                Configure Azure DevOps environment variables to load modules.
                <br />See ADO_MODULES_GUIDE.md for setup instructions.
              </div>
            </div>
          )}

          {!moduleError && modules.length === 0 && !isLoadingModules && (
            <div style={{
              padding: '16px',
              marginBottom: '15px',
              background: 'rgba(255, 149, 0, 0.15)',
              border: '2px solid rgba(255, 149, 0, 0.5)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ff9f0a'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                📦 No Modules Found
              </div>
              <div style={{ lineHeight: '1.4' }}>
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
                  onClick={() => addNode(template)}
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

        {selectedNode && (
          <div className="wb-config-panel">
            <div className="wb-config-header">
              <h3 className="wb-config-title">Module Config</h3>
              <button onClick={deleteNode} className="wb-delete-button">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="wb-config-fields">
              <div className="wb-config-field">
                <label className="wb-config-label">Module Type</label>
                <div
                  className="wb-config-input"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {selectedNode.data.label}
                </div>
              </div>

              {selectedNode.data.config &&
                Object.entries(selectedNode.data.config).map(([key, value]) => (
                  <div key={key} className="wb-config-field">
                    <label className="wb-config-label">{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { [key]: e.target.value })}
                      className="wb-config-input"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="wb-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={edgeOptions}
          connectionMode={ConnectionMode.Loose}
          fitView
          attributionPosition="bottom-left"
          style={{
            background: 'var(--bg-gradient)',
          }}
        >
          <Background variant="dots" gap={25} size={2} color="var(--border-color)" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.status) {
                return getStatusColor(node.data.status);
              }
              return 'var(--primary-color)';
            }}
          />

          <Panel position="top-right">
            <div className="wb-button-group">
              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={isSaving || nodes.length === 0}
                className="wb-button wb-settings-button"
                title="Save Workflow"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : currentWorkflowId ? 'Update' : 'Save'}</span>
              </button>

              <Link to="/saved-workflows" className="wb-button wb-settings-button" style={{ textDecoration: 'none' }}>
                <FolderOpen size={16} />
                <span>Saved</span>
              </Link>

              <button
                onClick={executeWorkflow}
                disabled={isRunning || nodes.length === 0}
                className={`wb-button ${isRunning || nodes.length === 0 ? 'wb-disabled-button' : 'wb-execute-button'
                  }`}
              >
                <Play size={16} />
                <span>{isRunning ? 'Executing...' : 'Execute Flow'}</span>
              </button>
            </div>
          </Panel>

          <Panel position="top-left">
            <div className="wb-stats-panel">
              <div className="wb-stat-item">
                <div className="wb-stat-label">Modules</div>
                <div className="wb-stat-value">{nodes.length}</div>
              </div>
              <div className="wb-stat-item">
                <div className="wb-stat-label">Links</div>
                <div className="wb-stat-value">{edges.length}</div>
              </div>
              <div className="wb-stat-item">
                <div className="wb-stat-label">Status</div>
                <div
                  className="wb-stat-value"
                  style={{
                    color: isRunning ? '#ffaa00' : 'var(--primary-color)',
                  }}
                >
                  {isRunning ? 'Active' : 'Ready'}
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
        <Chatbox />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="wb-modal-overlay" onClick={() => setShowSaveDialog(false)}>
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
                  placeholder="Enter workflow name..."
                  autoFocus
                />
              </div>
              <div className="wb-modal-info">
                <p>Nodes: {nodes.length} | Connections: {edges.length}</p>
              </div>
            </div>
            <div className="wb-modal-actions">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="wb-button wb-settings-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkflow}
                disabled={!workflowName.trim() || isSaving}
                className="wb-button wb-execute-button"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
