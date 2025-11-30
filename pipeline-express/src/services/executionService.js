/**
 * Execution Service
 * Handles workflow execution tracking and history
 */

import { supabase } from '../config/supabase';
import { authService } from './authService';

export const executionService = {
  /**
   * Create a new workflow execution
   */
  async createExecution(workflowId, metadata = {}) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        status: 'pending',
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating execution:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update execution status
   */
  async updateExecution(executionId, updates) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .update(updates)
      .eq('id', executionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating execution:', error);
      throw error;
    }

    return data;
  },

  /**
   * Mark execution as completed
   */
  async completeExecution(executionId) {
    return this.updateExecution(executionId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  },

  /**
   * Mark execution as failed
   */
  async failExecution(executionId, errorMessage) {
    return this.updateExecution(executionId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    });
  },

  /**
   * Get execution by ID
   */
  async getExecution(executionId) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      console.error('Error fetching execution:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get all executions for a workflow
   */
  async getExecutions(workflowId, limit = 50) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching executions:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get recent executions across all workflows
   */
  async getRecentExecutions(limit = 20) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*, workflows(name)')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent executions:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create node execution record
   */
  async createNodeExecution(executionId, nodeId, nodeType) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('node_executions')
      .insert({
        execution_id: executionId,
        node_id: nodeId,
        node_type: nodeType,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating node execution:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update node execution status
   */
  async updateNodeExecution(executionId, nodeId, updates) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('node_executions')
      .update(updates)
      .eq('execution_id', executionId)
      .eq('node_id', nodeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating node execution:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get all node executions for an execution
   */
  async getNodeExecutions(executionId) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('node_executions')
      .select('*')
      .eq('execution_id', executionId)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error fetching node executions:', error);
      throw error;
    }

    return data;
  },

  /**
   * Delete execution and all related node executions
   */
  async deleteExecution(executionId) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Node executions will be deleted automatically due to CASCADE
    const { error } = await supabase
      .from('workflow_executions')
      .delete()
      .eq('id', executionId);

    if (error) {
      console.error('Error deleting execution:', error);
      throw error;
    }

    return true;
  },

  /**
   * Trigger workflow execution via n8n
   */
  async triggerWorkflowExecution(executionId, workflowData) {
    const USE_PROXY = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_USE_PROXY === 'true';

    if (!USE_PROXY) {
      throw new Error('Proxy mode must be enabled to trigger n8n workflows');
    }

    try {
      const response = await authService.webhookRequest('execute-workflow', {
        execution_id: executionId,
        workflow_id: workflowData.workflow_id,
        nodes: workflowData.nodes,
        edges: workflowData.edges,
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error triggering workflow execution:', error);
      throw error;
    }
  },

  /**
   * Get execution statistics for a workflow
   */
  async getExecutionStats(workflowId) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('status')
      .eq('workflow_id', workflowId);

    if (error) {
      console.error('Error fetching execution stats:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      completed: data.filter(e => e.status === 'completed').length,
      failed: data.filter(e => e.status === 'failed').length,
      running: data.filter(e => e.status === 'running').length,
      pending: data.filter(e => e.status === 'pending').length,
    };

    return stats;
  },
};

export default executionService;
