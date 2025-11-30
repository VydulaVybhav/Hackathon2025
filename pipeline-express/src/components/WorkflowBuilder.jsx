import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useEnvironment } from '../context/EnvironmentContext';
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
import { Play, Home as HomeIcon, Palette, FolderOpen, Settings } from 'lucide-react';
import CustomNode from './workflow/CustomNode';
import SaveWorkflowDialog from './workflow/SaveWorkflowDialog';
import ModulePanel from './workflow/ModulePanel';
import ConfigPanel from './workflow/ConfigPanel';
import EnvironmentConfigDialog from './EnvironmentConfigDialog';
import SupabaseWarning from './SupabaseWarning';
import { useWorkflow } from '../hooks/useWorkflow';
import { useWorkflowStorage } from '../hooks/useWorkflowStorage';
import { useModuleLoader } from '../hooks/useModuleLoader';
import { useToast } from '../context/ToastContext';
import { getStatusColor } from '../utils/workflowUtils';
import { STATUS_TEXT, BUTTON_TEXT, ERROR_MESSAGES, WORKFLOW_DEFAULTS, SUCCESS_MESSAGES } from '../constants/appConstants';
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
  const [showEnvConfigDialog, setShowEnvConfigDialog] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currentEnv } = useEnvironment();
  const { showSuccess, showError } = useToast();
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
    switchEnvironment,
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

  // Switch environment when currentEnv changes
  useEffect(() => {
    switchEnvironment(currentEnv);
  }, [currentEnv, switchEnvironment]);

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
      description: WORKFLOW_DEFAULTS.DESCRIPTION_TEMPLATE(nodes.length),
      nodes,
      edges,
    };

    if (currentWorkflowId) {
      const result = await updateWorkflow(currentWorkflowId, workflow);
      if (result.success) {
        showSuccess(SUCCESS_MESSAGES.WORKFLOW_UPDATED);
      } else {
        showError(`Error: ${result.error || ERROR_MESSAGES.WORKFLOW_UPDATE_FAILED}`);
      }
    } else {
      const result = await saveWorkflow(workflow);
      if (result.success && result.data) {
        setCurrentWorkflowId(result.data.id);
        showSuccess(SUCCESS_MESSAGES.WORKFLOW_SAVED);
      } else {
        showError(`Error: ${result.error || ERROR_MESSAGES.WORKFLOW_SAVE_FAILED}`);
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
              <span>{BUTTON_TEXT.HOME}</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="wb-button wb-settings-button"
              style={{ padding: '8px 12px', fontSize: '12px' }}
              title={`Current theme: ${theme}`}
            >
              <Palette size={14} />
              <span>{BUTTON_TEXT.THEME}</span>
            </button>
          </div>
          <h1 className="wb-sidebar-title">Neural Flow</h1>
          <p className="wb-sidebar-subtitle">Build your digital pipeline</p>
        </div>

        <ModulePanel
          modules={modules}
          moduleSource={moduleSource}
          moduleError={moduleError}
          isLoadingModules={isLoadingModules}
          hoveredTemplate={hoveredTemplate}
          setHoveredTemplate={setHoveredTemplate}
          onAddNode={addNode}
        />

        <ConfigPanel
          selectedNode={selectedNode}
          onDelete={deleteNode}
          onUpdateConfig={updateNodeConfig}
        />
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
                onClick={() => setShowEnvConfigDialog(true)}
                className="wb-button wb-env-config-button"
                title="Configure environment defaults"
                style={{
                  background: 'var(--primary-color)',
                  color: '#000',
                  fontWeight: 600,
                }}
              >
                <Settings size={16} />
                <span>{currentEnv.toUpperCase()}</span>
              </button>

              <button
                onClick={() => setShowSaveDialog(true)}
                disabled={isSaving || nodes.length === 0}
                className="wb-button wb-settings-button"
                title={BUTTON_TEXT.SAVE_WORKFLOW}
              >
                <FolderOpen size={16} />
                <span>{isSaving ? BUTTON_TEXT.SAVING : currentWorkflowId ? BUTTON_TEXT.UPDATE : BUTTON_TEXT.SAVE}</span>
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
                <span>{isRunning ? STATUS_TEXT.EXECUTING : STATUS_TEXT.EXECUTE}</span>
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
                  {isRunning ? STATUS_TEXT.RUNNING : STATUS_TEXT.IDLE}
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
        <Chatbox />
      </div>

      {/* Save Dialog */}
      <SaveWorkflowDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveWorkflow}
        workflowName={workflowName}
        setWorkflowName={setWorkflowName}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        isSaving={isSaving}
      />

      {/* Environment Config Dialog */}
      <EnvironmentConfigDialog
        isOpen={showEnvConfigDialog}
        onClose={() => setShowEnvConfigDialog(false)}
        nodes={nodes}
      />
    </div>
  );
};

export default WorkflowBuilder;
