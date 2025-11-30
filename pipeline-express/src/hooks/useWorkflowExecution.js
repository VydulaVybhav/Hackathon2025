/**
 * useWorkflowExecution Hook
 * Subscribes to real-time workflow execution updates via Supabase Realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';

export const useWorkflowExecution = (executionId) => {
  const [execution, setExecution] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({});
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!executionId || !supabase) {
      setIsSubscribed(false);
      return;
    }

    console.log(`Subscribing to execution: ${executionId}`);

    // Create a unique channel for this execution
    const channel = supabase
      .channel(`execution:${executionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'pipeline-express',
          table: 'workflow_executions',
          filter: `id=eq.${executionId}`,
        },
        (payload) => {
          console.log('Execution update received:', payload);
          if (payload.new) {
            setExecution(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'pipeline-express',
          table: 'node_executions',
          filter: `execution_id=eq.${executionId}`,
        },
        (payload) => {
          console.log('Node execution update received:', payload);
          if (payload.new) {
            setNodeStatuses((prev) => ({
              ...prev,
              [payload.new.node_id]: {
                status: payload.new.status,
                started_at: payload.new.started_at,
                completed_at: payload.new.completed_at,
                error_message: payload.new.error_message,
                output_data: payload.new.output_data,
              },
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setError('Failed to subscribe to realtime updates');
          setIsSubscribed(false);
        }
      });

    // Cleanup function
    return () => {
      console.log(`Unsubscribing from execution: ${executionId}`);
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [executionId]);

  // Fetch initial execution data
  useEffect(() => {
    if (!executionId || !supabase) return;

    const fetchInitialData = async () => {
      try {
        // Fetch execution
        const { data: execData, error: execError } = await supabase
          .from('workflow_executions')
          .select('*')
          .eq('id', executionId)
          .single();

        if (execError) throw execError;
        setExecution(execData);

        // Fetch node executions
        const { data: nodeData, error: nodeError } = await supabase
          .from('node_executions')
          .select('*')
          .eq('execution_id', executionId);

        if (nodeError) throw nodeError;

        // Initialize node statuses
        const statuses = {};
        nodeData.forEach((node) => {
          statuses[node.node_id] = {
            status: node.status,
            started_at: node.started_at,
            completed_at: node.completed_at,
            error_message: node.error_message,
            output_data: node.output_data,
          };
        });
        setNodeStatuses(statuses);
      } catch (err) {
        console.error('Error fetching initial execution data:', err);
        setError(err.message);
      }
    };

    fetchInitialData();
  }, [executionId]);

  // Helper function to get status for a specific node
  const getNodeStatus = useCallback(
    (nodeId) => {
      return nodeStatuses[nodeId]?.status || 'idle';
    },
    [nodeStatuses]
  );

  // Helper function to check if execution is running
  const isRunning = execution?.status === 'running' || execution?.status === 'pending';

  // Helper function to check if execution is complete
  const isComplete = execution?.status === 'completed' || execution?.status === 'failed';

  return {
    execution,
    nodeStatuses,
    isSubscribed,
    error,
    getNodeStatus,
    isRunning,
    isComplete,
  };
};

export default useWorkflowExecution;
