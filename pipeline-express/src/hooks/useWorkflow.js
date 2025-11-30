import { useCallback, useState, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { generateNodeId, generateRandomPosition } from '../utils/workflowUtils';
import { TIMING } from '../constants/appConstants';
import { executionService } from '../services/executionService';
import { useWorkflowExecution } from './useWorkflowExecution';
import { configService } from '../services/configService';

export const useWorkflow = (workflowId = null) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState(null);
  const [executionError, setExecutionError] = useState(null);

  // Subscribe to real-time execution updates
  const { nodeStatuses, isComplete } = useWorkflowExecution(currentExecutionId);

  // Update node statuses from realtime subscription
  useEffect(() => {
    if (!nodeStatuses || Object.keys(nodeStatuses).length === 0) return;

    setNodes((nds) =>
      nds.map((node) => {
        const realtimeStatus = nodeStatuses[node.id];
        if (realtimeStatus) {
          return {
            ...node,
            data: {
              ...node.data,
              status: realtimeStatus.status,
              error_message: realtimeStatus.error_message,
            },
          };
        }
        return node;
      })
    );
  }, [nodeStatuses, setNodes]);

  // Handle execution completion
  useEffect(() => {
    if (isComplete) {
      setIsRunning(false);
      // Reset to idle after delay
      setTimeout(() => {
        setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
        setCurrentExecutionId(null);
      }, TIMING.RESET_DELAY);
    }
  }, [isComplete, setNodes]);

  const onConnect = useCallback(
    (params) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--primary-color)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary-color)' },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (template) => {
      // Initialize environment-aware configs using ADO template parameters
      const templateType = template.type;
      const templateParameters = template._parameters || [];

      // Create default configs from template parameters immediately
      const defaultConfig = {};
      if (templateParameters && Array.isArray(templateParameters)) {
        templateParameters.forEach((param) => {
          defaultConfig[param.name] = param.default || param.defaultValue || '';
        });
      }

      // Initial env configs (will be updated from database)
      const initialEnvConfigs = {
        dev: { ...defaultConfig },
        staging: { ...defaultConfig },
        prod: { ...defaultConfig },
      };

      const newNode = {
        id: generateNodeId(),
        type: 'customNode',
        position: generateRandomPosition(),
        data: {
          ...template,
          status: 'idle',
          templateType: templateType, // Store for config lookups
          _parameters: templateParameters, // Keep original parameters for config panel
          env_configs: initialEnvConfigs, // Environment-specific configs
          config: initialEnvConfigs.dev, // Default to dev config for display
        },
      };

      // Add node immediately for instant UI feedback
      setNodes((nds) => [...nds, newNode]);

      // Load saved configs from database in the background
      configService.initializeNodeConfigs(templateType, templateParameters).then((envConfigs) => {
        // Update the node with saved configs if different from defaults
        setNodes((nds) =>
          nds.map((node) =>
            node.id === newNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    env_configs: envConfigs,
                    config: envConfigs.dev,
                  },
                }
              : node
          )
        );
      }).catch((error) => {
        console.error('Failed to load saved configs:', error);
        // Node already has template defaults, so this is non-critical
      });
    },
    [setNodes]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const updateNodeConfig = useCallback(
    async (nodeId, environment, configUpdates) => {
      // Update node's environment-specific config
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;

          const updatedEnvConfigs = {
            ...node.data.env_configs,
            [environment]: {
              ...node.data.env_configs[environment],
              ...configUpdates,
            },
          };

          return {
            ...node,
            data: {
              ...node.data,
              env_configs: updatedEnvConfigs,
              // Update display config if it's the current environment
              config: updatedEnvConfigs[environment],
            },
          };
        })
      );

      // Save to database (find the node first to get its template type)
      const node = nodes.find((n) => n.id === nodeId);
      if (node && node.data.templateType) {
        try {
          await configService.saveTemplateConfig(
            node.data.templateType,
            environment,
            configUpdates
          );
        } catch (error) {
          console.error('Failed to save config to database:', error);
        }
      }
    },
    [setNodes, nodes]
  );

  const switchEnvironment = useCallback(
    (environment) => {
      // Update all nodes to show configs for the selected environment
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            config: node.data.env_configs?.[environment] || node.data.config,
          },
        }))
      );
    },
    [setNodes]
  );

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      console.warn('No nodes to execute');
      return;
    }

    setExecutionError(null);
    setIsRunning(true);

    try {
      // Create execution record in database
      console.log('Creating execution record...');
      const execution = await executionService.createExecution(workflowId, {
        node_count: nodes.length,
        edge_count: edges.length,
      });

      setCurrentExecutionId(execution.id);
      console.log('Execution created:', execution.id);

      // Trigger n8n workflow via webhook
      const USE_PROXY = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_USE_PROXY === 'true';

      if (USE_PROXY) {
        console.log('Triggering n8n workflow...');
        await executionService.triggerWorkflowExecution(execution.id, {
          workflow_id: workflowId,
          nodes: nodes,
          edges: edges,
        });
        console.log('n8n workflow triggered successfully');
      } else {
        // Fallback to simulation mode if proxy is disabled
        console.warn('Proxy mode disabled - using simulation');
        await simulateExecution(execution.id, nodes);
      }

    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionError(error.message);
      setIsRunning(false);

      // Mark execution as failed if it was created
      if (currentExecutionId) {
        try {
          await executionService.failExecution(currentExecutionId, error.message);
        } catch (failError) {
          console.error('Failed to mark execution as failed:', failError);
        }
      }
    }
  }, [nodes, edges, workflowId, currentExecutionId]);

  // Fallback simulation when proxy is not enabled
  const simulateExecution = async (executionId, nodesToExecute) => {
    console.log('Running simulation...');

    for (const node of nodesToExecute) {
      // Update node status to running
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
        )
      );

      await new Promise((resolve) => setTimeout(resolve, TIMING.EXECUTION_NODE_DELAY));

      // Update node status to success
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, status: 'success' } } : n
        )
      );
    }

    // Mark execution as completed
    await executionService.completeExecution(executionId);
    setIsRunning(false);

    // Reset after delay
    setTimeout(() => {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
      setCurrentExecutionId(null);
    }, TIMING.RESET_DELAY);
  };

  return {
    nodes,
    edges,
    selectedNode,
    isRunning,
    currentExecutionId,
    executionError,
    nodeStatuses,
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
  };
};
