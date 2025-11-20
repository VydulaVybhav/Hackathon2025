import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  ConnectionMode,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Webhook,
  Database,
  Mail,
  Calendar,
  Play,
  Settings,
  Trash2,
  Plus,
  Code,
  Filter,
  MessageSquare,
  Clock,
  Home as HomeIcon,
  Palette
} from 'lucide-react';
import './WorkflowBuilder.css';

// Custom node component with cyberpunk styling
const CustomNode = ({ data, selected, id }) => {
  const Icon = data.icon;

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'var(--primary-color)';
      case 'error': return '#ff4444';
      case 'running': return '#ffaa00';
      default: return '#666';
    }
  };

  return (
    <div className={`wb-custom-node ${selected ? 'wb-node-selected' : ''}`}>
      {/* Input Handle */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="custom-handle-input"
        />
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="custom-handle-output"
      />

      <div className="wb-node-header">
        <Icon size={20} className="text-primary" style={{ color: 'var(--primary-color)' }} />
        <div className="wb-node-template-content">
          <div className="wb-node-title">{data.label}</div>
          {data.description && (
            <div className="wb-node-description">{data.description}</div>
          )}
        </div>
      </div>

      <div className="wb-node-body">
        {data.config ? (
          <div className="wb-node-config">
            {Object.entries(data.config).map(([key, value]) => (
              <div key={key} className="wb-node-config-row">
                <span className="wb-node-config-key">{key}:</span>
                <span className="wb-node-config-value">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="wb-node-empty-state">
            Click to configure
          </div>
        )}
      </div>

      {data.status && data.status !== 'idle' && (
        <div
          className="wb-status-indicator"
          style={{
            backgroundColor: getStatusColor(data.status),
            ...(data.status === 'running' && {
              animation: 'cyberpunk-pulse 2s ease-in-out infinite'
            })
          }}
        />
      )}
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode,
};

const WorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const { theme, toggleTheme } = useTheme();

  // Node templates
  const nodeTemplates = [
    {
      type: 'trigger',
      label: 'Neural Link',
      description: 'Trigger on data stream',
      icon: Webhook,
      config: { protocol: 'TCP', port: '8080' }
    },
    {
      type: 'action',
      label: 'Data Matrix',
      description: 'Query the mainframe',
      icon: Database,
      config: { cluster: 'main_db', query: 'SELECT' }
    },
    {
      type: 'action',
      label: 'Comms Link',
      description: 'Send secure message',
      icon: Mail,
      config: { channel: 'encrypted', priority: 'high' }
    },
    {
      type: 'action',
      label: 'Time Sync',
      description: 'Schedule operation',
      icon: Calendar,
      config: { cycle: '0 9 * * *', zone: 'GMT' }
    },
    {
      type: 'action',
      label: 'Code Inject',
      description: 'Execute payload',
      icon: Code,
      config: { runtime: 'node.js', timeout: '30s' }
    },
    {
      type: 'action',
      label: 'Data Filter',
      description: 'Process and filter',
      icon: Filter,
      config: { rule: 'status === "active"' }
    },
    {
      type: 'action',
      label: 'Net Broadcast',
      description: 'Network transmission',
      icon: MessageSquare,
      config: { network: 'darknet', encryption: 'AES' }
    },
    {
      type: 'action',
      label: 'Sleep Mode',
      description: 'Delay execution',
      icon: Clock,
      config: { duration: '5m', mode: 'standby' }
    }
  ];

  const onConnect = useCallback(
    (params) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--primary-color)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary-color)' }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback((template) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'customNode',
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 200 + 100
      },
      data: {
        ...template,
        status: 'idle'
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;

    setIsRunning(true);

    for (const node of nodes) {
      setNodes((nds) => nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
      ));

      await new Promise(resolve => setTimeout(resolve, 1200));

      setNodes((nds) => nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'success' } } : n
      ));
    }

    setIsRunning(false);

    setTimeout(() => {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
    }, 3000);
  }, [nodes, setNodes]);

  const updateNodeConfig = useCallback((nodeId, newConfig) => {
    setNodes((nds) => nds.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, config: { ...node.data.config, ...newConfig } } }
        : node
    ));
  }, [setNodes]);

  const edgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'var(--primary-color)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary-color)' }
  }), []);

  return (
    <div className="wb-container">
      <div className="wb-sidebar">
        <div className="wb-sidebar-header">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <Link to="/" className="wb-button wb-settings-button" style={{ padding: '8px 12px', fontSize: '12px', textDecoration: 'none' }}>
              <HomeIcon size={14} />
              <span>Home</span>
            </Link>
            <button onClick={toggleTheme} className="wb-button wb-settings-button" style={{ padding: '8px 12px', fontSize: '12px' }} title={`Current theme: ${theme}`}>
              <Palette size={14} />
              <span>Theme</span>
            </button>
          </div>
          <h1 className="wb-sidebar-title">Neural Flow</h1>
          <p className="wb-sidebar-subtitle">Build your digital pipeline</p>
        </div>

        <div className="wb-templates-container">
          <h2 className="wb-templates-title">System Modules</h2>
          <div className="wb-templates-list">
            {nodeTemplates.map((template, index) => {
              const Icon = template.icon;
              const isHovered = hoveredTemplate === index;
              return (
                <button
                  key={index}
                  onClick={() => addNode(template)}
                  onMouseEnter={() => setHoveredTemplate(index)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  className="wb-node-template"
                >
                  <Icon size={20} style={{ color: 'var(--primary-color)' }} />
                  <div className="wb-node-template-content">
                    <div className="wb-node-template-label">{template.label}</div>
                    <div className="wb-node-template-description">{template.description}</div>
                  </div>
                  <Plus size={16} style={{ color: 'var(--primary-color)', opacity: isHovered ? 1 : 0.7 }} />
                </button>
              );
            })}
          </div>
        </div>

        {selectedNode && (
          <div className="wb-config-panel">
            <div className="wb-config-header">
              <h3 className="wb-config-title">Module Config</h3>
              <button
                onClick={deleteNode}
                className="wb-delete-button"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="wb-config-fields">
              <div className="wb-config-field">
                <label className="wb-config-label">Module Type</label>
                <div className="wb-config-input" style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                  {selectedNode.data.label}
                </div>
              </div>

              {selectedNode.data.config && Object.entries(selectedNode.data.config).map(([key, value]) => (
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
            background: 'var(--bg-gradient)'
          }}
        >
          <Background
            variant="dots"
            gap={25}
            size={2}
            color="var(--border-color)"
          />
          <Controls
            showInteractive={false}
            style={{
              button: {
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary-color)'
              }
            }}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.status === 'running') return '#ffaa00';
              if (node.data?.status === 'success') return 'var(--primary-color)';
              if (node.data?.status === 'error') return '#ff4444';
              return 'var(--primary-color)';
            }}
            style={{
              background: 'var(--header-bg)',
              border: '1px solid var(--border-color)'
            }}
          />

          <Panel position="top-right">
            <div className="wb-button-group">
              <button
                onClick={executeWorkflow}
                disabled={isRunning || nodes.length === 0}
                className={`wb-button ${isRunning || nodes.length === 0 ? 'wb-disabled-button' : 'wb-execute-button'}`}
              >
                <Play size={16} />
                <span>{isRunning ? 'Executing...' : 'Execute Flow'}</span>
              </button>

              <button
                className="wb-button wb-settings-button"
              >
                <Settings size={16} />
                <span>Config</span>
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
                <div className="wb-stat-value" style={{
                  color: isRunning ? '#ffaa00' : 'var(--primary-color)'
                }}>
                  {isRunning ? 'Active' : 'Ready'}
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowBuilder;