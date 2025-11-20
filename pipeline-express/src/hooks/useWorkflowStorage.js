import { useState, useCallback } from 'react';
import { workflowService } from '../services/workflowService';

export const useWorkflowStorage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveWorkflow = useCallback(async (workflow) => {
    setIsSaving(true);
    try {
      const { data, error } = await workflowService.createWorkflow(workflow);

      if (error) {
        console.error('Error saving workflow:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error saving workflow:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateWorkflow = useCallback(async (id, updates) => {
    setIsSaving(true);
    try {
      const { data, error } = await workflowService.updateWorkflow(id, updates);

      if (error) {
        console.error('Error updating workflow:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating workflow:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadWorkflow = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const { data, error } = await workflowService.getWorkflow(id);

      if (error) {
        console.error('Error loading workflow:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error loading workflow:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await workflowService.getWorkflows();

      if (error) {
        console.error('Error loading workflows:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error loading workflows:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteWorkflow = useCallback(async (id) => {
    setIsSaving(true);
    try {
      const { error } = await workflowService.deleteWorkflow(id);

      if (error) {
        console.error('Error deleting workflow:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting workflow:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    saveWorkflow,
    updateWorkflow,
    loadWorkflow,
    loadAllWorkflows,
    deleteWorkflow,
    isSaving,
    isLoading,
  };
};
