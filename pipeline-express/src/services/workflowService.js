import { supabase, isSupabaseConfigured } from '../config/supabase';

export const workflowService = {
  // Get all workflows
  async getWorkflows() {
    if (!isSupabaseConfigured()) {
      return { data: [], error: 'Supabase not configured. Please add credentials to .env file.' };
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false });

    return { data, error };
  },

  // Get a single workflow by ID
  async getWorkflow(id) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase not configured. Please add credentials to .env file.' };
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  // Save a new workflow
  async createWorkflow(workflow) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase not configured. Please add credentials to .env file.' };
    }

    const workflowData = {
      name: workflow.name,
      description: workflow.description || '',
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      tags: workflow.tags || [],
      is_public: workflow.is_public || false,
      thumbnail: workflow.thumbnail || null,
    };

    const { data, error } = await supabase
      .from('workflows')
      .insert([workflowData])
      .select()
      .single();

    return { data, error };
  },

  // Update an existing workflow
  async updateWorkflow(id, updates) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: 'Supabase not configured. Please add credentials to .env file.' };
    }

    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Delete a workflow
  async deleteWorkflow(id) {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase not configured. Please add credentials to .env file.' };
    }

    const { error } = await supabase.from('workflows').delete().eq('id', id);

    return { error };
  },

  // Search workflows by name or tags
  async searchWorkflows(query) {
    if (!isSupabaseConfigured()) {
      return { data: [], error: 'Supabase not configured. Please add credentials to .env file.' };
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .or(`name.ilike.%${query}%,tags.cs.{${query}}`)
      .order('updated_at', { ascending: false });

    return { data, error };
  },

  // Get public workflows
  async getPublicWorkflows() {
    if (!isSupabaseConfigured()) {
      return { data: [], error: 'Supabase not configured. Please add credentials to .env file.' };
    }

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false });

    return { data, error };
  },
};
