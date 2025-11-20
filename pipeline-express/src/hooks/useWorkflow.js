import { useCallback, useState } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { generateNodeId, generateRandomPosition } from '../utils/workflowUtils';

export const useWorkflow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

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
      const newNode = {
        id: generateNodeId(),
        type: 'customNode',
        position: generateRandomPosition(),
        data: {
          ...template,
          status: 'idle',
        },
      };
      setNodes((nds) => [...nds, newNode]);
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
    (nodeId, newConfig) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, config: { ...node.data.config, ...newConfig } } }
            : node
        )
      );
    },
    [setNodes]
  );

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;

    setIsRunning(true);

    for (const node of nodes) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, status: 'success' } } : n
        )
      );
    }

    setIsRunning(false);

    setTimeout(() => {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
    }, 3000);
  }, [nodes, setNodes]);

  return {
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
  };
};
