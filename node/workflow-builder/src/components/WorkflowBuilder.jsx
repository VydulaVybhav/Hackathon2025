import React, { useState, useCallback, useMemo } from 'react';
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
  Clock
} from 'lucide-react';

// Cyberpunk theme styles
const styles = {
  container: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    background: 'linear-gradient(135deg, #0a0f0a 0%, #1a2e1a 100%)',
    color: '#e8f5e8',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  sidebar: {
    width: '320px',
    background: 'rgba(26, 46, 26, 0.3)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(0, 255, 65, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 30px rgba(0, 255, 65, 0.1)'
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid rgba(0, 255, 65, 0.1)',
    background: 'rgba(10, 15, 10, 0.5)'
  },
  sidebarTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00ff41',
    marginBottom: '8px',
    margin: 0,
    textShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
  },
  sidebarSubtitle: {
    fontSize: '14px',
    color: '#e8f5e8',
    margin: 0,
    opacity: 0.8
  },
  nodeTemplatesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  nodeTemplatesTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#00ff41',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
  },
  nodeTemplatesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  nodeTemplate: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#e8f5e8',
    border: '1px solid rgba(0, 255, 65, 0.2)',
    background: 'rgba(26, 46, 26, 0.2)',
    backdropFilter: 'blur(5px)',
    textAlign: 'left',
    width: '100%'
  },
  nodeTemplateHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 10px 30px rgba(0, 255, 65, 0.2)',
    borderColor: 'rgba(0, 255, 65, 0.4)',
    background: 'rgba(0, 255, 65, 0.1)'
  },
  nodeTemplateContent: {
    flex: 1,
    marginLeft: '12px'
  },
  nodeTemplateLabel: {
    fontWeight: '600',
    fontSize: '14px',
    margin: 0,
    marginBottom: '4px',
    color: '#00ff41'
  },
  nodeTemplateDescription: {
    fontSize: '12px',
    opacity: 0.8,
    margin: 0,
    color: '#e8f5e8'
  },
  configPanel: {
    borderTop: '1px solid rgba(0, 255, 65, 0.1)',
    padding: '16px',
    background: 'rgba(10, 15, 10, 0.6)',
    backdropFilter: 'blur(10px)'
  },
  configHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  configTitle: {
    fontWeight: '600',
    color: '#00ff41',
    margin: 0,
    textShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
  },
  deleteButton: {
    padding: '8px',
    color: '#ff4444',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center'
  },
  configFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  configField: {
    display: 'flex',
    flexDirection: 'column'
  },
  configLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#00ff41',
    marginBottom: '4px',
    textTransform: 'capitalize'
  },
  configInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid rgba(0, 255, 65, 0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s',
    background: 'rgba(10, 15, 10, 0.5)',
    color: '#e8f5e8'
  },
  canvas: {
    flex: 1,
    position: 'relative'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '50px',
    fontWeight: '600',
    transition: 'all 0.3s',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  executeButton: {
    background: 'linear-gradient(45deg, #00ff41, #39ff14)',
    color: '#0a0f0a',
    boxShadow: '0 5px 15px rgba(0, 255, 65, 0.3)'
  },
  executeButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(0, 255, 65, 0.5)'
  },
  disabledButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#666',
    cursor: 'not-allowed'
  },
  settingsButton: {
    background: 'transparent',
    border: '1px solid #00ff41',
    color: '#00ff41'
  },
  statsPanel: {
    background: 'rgba(26, 46, 26, 0.3)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 255, 65, 0.2)',
    border: '1px solid rgba(0, 255, 65, 0.1)',
    padding: '16px',
    display: 'flex',
    gap: '24px',
    fontSize: '14px'
  },
  statItem: {
    textAlign: 'center'
  },
  statLabel: {
    color: '#e8f5e8',
    margin: 0,
    marginBottom: '4px',
    opacity: 0.8
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#00ff41',
    margin: 0,
    textShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
  },
  customNode: {
    position: 'relative',
    background: 'rgba(26, 46, 26, 0.3)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 255, 65, 0.2)',
    minWidth: '220px',
    transition: 'all 0.3s',
    overflow: 'hidden',
    border: '1px solid rgba(0, 255, 65, 0.2)'
  },
  nodeSelected: {
    border: '2px solid #00ff41',
    boxShadow: '0 15px 40px rgba(0, 255, 65, 0.4), 0 0 0 4px rgba(0, 255, 65, 0.1)'
  },
  nodeHeader: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(0, 255, 65, 0.1)',
    borderBottom: '1px solid rgba(0, 255, 65, 0.2)'
  },
  nodeTitle: {
    fontWeight: '600',
    fontSize: '14px',
    margin: 0,
    marginBottom: '4px',
    color: '#00ff41',
    textShadow: '0 0 5px rgba(0, 255, 65, 0.3)'
  },
  nodeDescription: {
    fontSize: '12px',
    opacity: 0.8,
    margin: 0,
    color: '#e8f5e8'
  },
  nodeBody: {
    padding: '16px',
    background: 'rgba(10, 15, 10, 0.3)'
  },
  nodeConfig: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  nodeConfigRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  nodeConfigKey: {
    color: '#00ff41',
    textTransform: 'capitalize',
    opacity: 0.8
  },
  nodeConfigValue: {
    fontWeight: '500',
    color: '#e8f5e8'
  },
  nodeEmptyState: {
    fontSize: '12px',
    color: '#e8f5e8',
    textAlign: 'center',
    padding: '8px',
    opacity: 0.6
  },
  statusIndicator: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid #0a0f0a'
  }
};

// Custom node component with cyberpunk styling
const CustomNode = ({ data, selected, id }) => {
  const Icon = data.icon;
  
  const nodeStyle = {
    ...styles.customNode,
    ...(selected && styles.nodeSelected)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#00ff41';
      case 'error': return '#ff4444';
      case 'running': return '#ffaa00';
      default: return '#666';
    }
  };

  return (
    <div style={nodeStyle}>
      {/* Input Handle */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            background: '#00ff41',
            width: '12px',
            height: '12px',
            border: '2px solid #0a0f0a',
            left: '-6px',
            boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
          }}
        />
      )}
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#00ff41',
          width: '12px',
          height: '12px',
          border: '2px solid #0a0f0a',
          right: '-6px',
          boxShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
        }}
      />

      <div style={styles.nodeHeader}>
        <Icon size={20} color="#00ff41" />
        <div style={styles.nodeTemplateContent}>
          <div style={styles.nodeTitle}>{data.label}</div>
          {data.description && (
            <div style={styles.nodeDescription}>{data.description}</div>
          )}
        </div>
      </div>
      
      <div style={styles.nodeBody}>
        {data.config ? (
          <div style={styles.nodeConfig}>
            {Object.entries(data.config).map(([key, value]) => (
              <div key={key} style={styles.nodeConfigRow}>
                <span style={styles.nodeConfigKey}>{key}:</span>
                <span style={styles.nodeConfigValue}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.nodeEmptyState}>
            Click to configure
          </div>
        )}
      </div>
      
      {data.status && data.status !== 'idle' && (
        <div 
          style={{
            ...styles.statusIndicator,
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
  
  // Node templates with cyberpunk theme
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
        style: { stroke: '#00ff41', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00ff41' }
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
    style: { stroke: '#00ff41', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00ff41' }
  }), []);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h1 style={styles.sidebarTitle}>Neural Flow</h1>
          <p style={styles.sidebarSubtitle}>Build your digital pipeline</p>
        </div>
        
        <div style={styles.nodeTemplatesContainer}>
          <h2 style={styles.nodeTemplatesTitle}>System Modules</h2>
          <div style={styles.nodeTemplatesList}>
            {nodeTemplates.map((template, index) => {
              const Icon = template.icon;
              const isHovered = hoveredTemplate === index;
              return (
                <button
                  key={index}
                  onClick={() => addNode(template)}
                  onMouseEnter={() => setHoveredTemplate(index)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  style={{
                    ...styles.nodeTemplate,
                    ...(isHovered && styles.nodeTemplateHover)
                  }}
                >
                  <Icon size={20} color="#00ff41" />
                  <div style={styles.nodeTemplateContent}>
                    <div style={styles.nodeTemplateLabel}>{template.label}</div>
                    <div style={styles.nodeTemplateDescription}>{template.description}</div>
                  </div>
                  <Plus size={16} color="#00ff41" style={{ opacity: isHovered ? 1 : 0.7 }} />
                </button>
              );
            })}
          </div>
        </div>

        {selectedNode && (
          <div style={styles.configPanel}>
            <div style={styles.configHeader}>
              <h3 style={styles.configTitle}>Module Config</h3>
              <button
                onClick={deleteNode}
                style={styles.deleteButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'rgba(255, 68, 68, 0.3)';
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div style={styles.configFields}>
              <div style={styles.configField}>
                <label style={styles.configLabel}>Module Type</label>
                <div style={{ ...styles.configInput, backgroundColor: 'rgba(10, 15, 10, 0.8)', border: '1px solid rgba(0, 255, 65, 0.2)' }}>
                  {selectedNode.data.label}
                </div>
              </div>
              
              {selectedNode.data.config && Object.entries(selectedNode.data.config).map(([key, value]) => (
                <div key={key} style={styles.configField}>
                  <label style={styles.configLabel}>{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { [key]: e.target.value })}
                    style={styles.configInput}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#00ff41';
                      e.target.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0, 255, 65, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.canvas}>
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
            background: 'linear-gradient(135deg, #0a0f0a 0%, #1a2e1a 100%)'
          }}
        >
          <Background 
            variant="dots" 
            gap={25} 
            size={2} 
            color="rgba(0, 255, 65, 0.2)" 
          />
          <Controls 
            showInteractive={false}
            style={{
              button: {
                background: 'rgba(26, 46, 26, 0.8)',
                border: '1px solid rgba(0, 255, 65, 0.3)',
                color: '#00ff41'
              }
            }}
          />
          <MiniMap 
            nodeColor={(node) => {
              if (node.data?.status === 'running') return '#ffaa00';
              if (node.data?.status === 'success') return '#00ff41';
              if (node.data?.status === 'error') return '#ff4444';
              return 'rgba(0, 255, 65, 0.5)';
            }}
            style={{
              background: 'rgba(10, 15, 10, 0.8)',
              border: '1px solid rgba(0, 255, 65, 0.3)'
            }}
          />
          
          <Panel position="top-right">
            <div style={styles.buttonGroup}>
              <button
                onClick={executeWorkflow}
                disabled={isRunning || nodes.length === 0}
                style={{
                  ...styles.button,
                  ...(isRunning || nodes.length === 0 ? styles.disabledButton : styles.executeButton)
                }}
                onMouseEnter={(e) => {
                  if (!isRunning && nodes.length > 0) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 25px rgba(0, 255, 65, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRunning && nodes.length > 0) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 5px 15px rgba(0, 255, 65, 0.3)';
                  }
                }}
              >
                <Play size={16} />
                <span>{isRunning ? 'Executing...' : 'Execute Flow'}</span>
              </button>
              
              <button 
                style={{ 
                  ...styles.button, 
                  ...styles.settingsButton 
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#00ff41';
                  e.target.style.color = '#0a0f0a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#00ff41';
                }}
              >
                <Settings size={16} />
                <span>Config</span>
              </button>
            </div>
          </Panel>

          <Panel position="top-left">
            <div style={styles.statsPanel}>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Modules</div>
                <div style={styles.statValue}>{nodes.length}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Links</div>
                <div style={styles.statValue}>{edges.length}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Status</div>
                <div style={{
                  ...styles.statValue,
                  color: isRunning ? '#ffaa00' : '#00ff41'
                }}>
                  {isRunning ? 'Active' : 'Ready'}
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <style>{`
        @keyframes cyberpunk-pulse {
          0%, 100% { 
            opacity: 1; 
            box-shadow: 0 0 5px currentColor;
          }
          50% { 
            opacity: 0.4; 
            box-shadow: 0 0 20px currentColor;
          }
        }
        
        .react-flow__handle {
          width: 12px !important;
          height: 12px !important;
          border: 2px solid #0a0f0a !important;
          border-radius: 50% !important;
          transition: all 0.3s ease !important;
          cursor: crosshair !important;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.5) !important;
        }
        
        .react-flow__handle:hover {
          transform: scale(1.4) !important;
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.8) !important;
        }
        
        .react-flow__connection-line {
          stroke: #00ff41 !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 0 5px rgba(0, 255, 65, 0.5)) !important;
        }
        
        .react-flow__edge {
          pointer-events: all !important;
        }
        
        .react-flow__edge-path {
          stroke: #00ff41 !important;
          stroke-width: 2px !important;
          transition: all 0.3s ease !important;
          filter: drop-shadow(0 0 3px rgba(0, 255, 65, 0.3)) !important;
        }
        
        .react-flow__edge:hover .react-flow__edge-path {
          stroke: #39ff14 !important;
          stroke-width: 3px !important;
          filter: drop-shadow(0 0 8px rgba(0, 255, 65, 0.6)) !important;
        }
        
        .react-flow__edge.animated .react-flow__edge-path {
          stroke-dasharray: 8;
          animation: matrix-flow 1s linear infinite;
        }
        
        @keyframes matrix-flow {
          to {
            stroke-dashoffset: -16;
          }
        }
        
        .react-flow__controls {
          background: rgba(26, 46, 26, 0.8) !important;
          border: 1px solid rgba(0, 255, 65, 0.3) !important;
          border-radius: 15px !important;
          backdrop-filter: blur(10px) !important;
        }
        
        .react-flow__controls-button {
          background: transparent !important;
          border: none !important;
          color: #00ff41 !important;
          transition: all 0.3s ease !important;
        }
        
        .react-flow__controls-button:hover {
          background: rgba(0, 255, 65, 0.1) !important;
          color: #39ff14 !important;
          transform: scale(1.1) !important;
        }
        
        .react-flow__minimap {
          background: rgba(10, 15, 10, 0.8) !important;
          border: 1px solid rgba(0, 255, 65, 0.3) !important;
          border-radius: 15px !important;
          backdrop-filter: blur(10px) !important;
        }
        
        .react-flow__attribution {
          background: rgba(10, 15, 10, 0.8) !important;
          color: #00ff41 !important;
          border: 1px solid rgba(0, 255, 65, 0.2) !important;
          border-radius: 10px !important;
          padding: 5px 10px !important;
          font-size: 11px !important;
        }
        
        .react-flow__attribution a {
          color: #00ff41 !important;
          text-decoration: none !important;
        }
        
        .react-flow__attribution a:hover {
          color: #39ff14 !important;
          text-shadow: 0 0 5px rgba(0, 255, 65, 0.5) !important;
        }
        
        /* Scrollbar styling for cyberpunk theme */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(10, 15, 10, 0.5);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #00ff41, #39ff14);
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #39ff14, #00ff41);
          box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
        }
        
        /* Add glowing text effect for selected elements */
        .cyberpunk-glow {
          text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
        }
        
        /* Matrix-style background animation */
        @keyframes matrix-bg {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        
        /* Pulse animation for active states */
        @keyframes cyberpunk-pulse-bg {
          0%, 100% { 
            background: rgba(0, 255, 65, 0.1);
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
          }
          50% { 
            background: rgba(0, 255, 65, 0.2);
            box-shadow: 0 0 40px rgba(0, 255, 65, 0.4);
          }
        }
      `}
        </style>
    </div>


    );};

export default WorkflowBuilder;