import { supabase } from '../config/supabase';

/**
 * Configuration Service - Manages environment-specific node configurations
 * Configs are stored per template type, not per individual node instance
 */
export const configService = {
  /**
   * Get saved configs for a specific template type
   * @param {string} templateType - The template type (e.g., "deploy", "test")
   * @param {string} userId - Optional user ID for user-specific configs
   * @returns {Promise<Object>} - Environment configs { dev: {...}, staging: {...}, prod: {...} }
   */
  async getTemplateConfigs(templateType, userId = null) {
    try {
      let query = supabase
        .from('workflow_configs')
        .select('configs, template_version, last_used_at')
        .eq('template_type', templateType);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching template configs:', error);
        return { dev: {}, staging: {}, prod: {} };
      }

      return data?.configs || { dev: {}, staging: {}, prod: {} };
    } catch (error) {
      console.error('Failed to get template configs:', error);
      return { dev: {}, staging: {}, prod: {} };
    }
  },

  /**
   * Save configs for a specific template type and environment
   * @param {string} templateType - The template type
   * @param {string} environment - The environment (dev/staging/prod)
   * @param {Object} configValues - The configuration values to save
   * @param {string} userId - Optional user ID
   */
  async saveTemplateConfig(templateType, environment, configValues, userId = null) {
    try {
      // First, get existing configs
      const existingConfigs = await this.getTemplateConfigs(templateType, userId);

      // Update the specific environment
      const updatedConfigs = {
        ...existingConfigs,
        [environment]: {
          ...existingConfigs[environment],
          ...configValues,
        },
      };

      // Upsert the config record
      const { data, error } = await supabase
        .from('workflow_configs')
        .upsert(
          {
            template_type: templateType,
            user_id: userId,
            configs: updatedConfigs,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: userId ? 'template_type,user_id' : 'template_type',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving template config:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save template config:', error);
      throw error;
    }
  },

  /**
   * Save configs for all environments at once
   * @param {string} templateType - The template type
   * @param {Object} allEnvConfigs - All environment configs { dev: {...}, staging: {...}, prod: {...} }
   * @param {string} userId - Optional user ID
   */
  async saveAllTemplateConfigs(templateType, allEnvConfigs, userId = null) {
    try {
      const { data, error } = await supabase
        .from('workflow_configs')
        .upsert(
          {
            template_type: templateType,
            user_id: userId,
            configs: allEnvConfigs,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: userId ? 'template_type,user_id' : 'template_type',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving all template configs:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save all template configs:', error);
      throw error;
    }
  },

  /**
   * Get config for a specific template type and environment
   * @param {string} templateType - The template type
   * @param {string} environment - The environment (dev/staging/prod)
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} - Configuration object for the environment
   */
  async getTemplateConfigForEnv(templateType, environment, userId = null) {
    const allConfigs = await this.getTemplateConfigs(templateType, userId);
    return allConfigs[environment] || {};
  },

  /**
   * Merge template default parameters with saved user configs
   * Returns parameter values with saved configs taking precedence over defaults
   * @param {Array} templateParameters - Array of parameter definitions from ADO template
   * @param {Object} savedConfigs - Saved user configs for the environment
   * @returns {Object} - Merged configuration object
   */
  mergeWithDefaults(templateParameters, savedConfigs = {}) {
    const merged = {};

    // Start with template defaults
    if (templateParameters && Array.isArray(templateParameters)) {
      templateParameters.forEach((param) => {
        const paramName = param.name;
        const defaultValue = param.default || param.defaultValue || '';

        // Use saved value if it exists, otherwise use template default
        merged[paramName] = savedConfigs[paramName] !== undefined
          ? savedConfigs[paramName]
          : defaultValue;
      });
    }

    // Add any saved configs that aren't in the template (for backwards compatibility)
    Object.keys(savedConfigs).forEach((key) => {
      if (!(key in merged)) {
        merged[key] = savedConfigs[key];
      }
    });

    return merged;
  },

  /**
   * Initialize environment configs for a new node using template parameters
   * @param {string} templateType - The template type
   * @param {Array} templateParameters - Parameter definitions from ADO template
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} - Environment configs { dev: {...}, staging: {...}, prod: {...} }
   */
  async initializeNodeConfigs(templateType, templateParameters, userId = null) {
    try {
      // Get any saved configs for this template type
      const savedConfigs = await this.getTemplateConfigs(templateType, userId);

      // Merge template defaults with saved values for each environment
      const envConfigs = {
        dev: this.mergeWithDefaults(templateParameters, savedConfigs.dev),
        staging: this.mergeWithDefaults(templateParameters, savedConfigs.staging),
        prod: this.mergeWithDefaults(templateParameters, savedConfigs.prod),
      };

      return envConfigs;
    } catch (error) {
      console.error('Failed to initialize node configs:', error);

      // Fallback: just use template defaults
      const defaultConfig = {};
      if (templateParameters && Array.isArray(templateParameters)) {
        templateParameters.forEach((param) => {
          defaultConfig[param.name] = param.default || param.defaultValue || '';
        });
      }

      return {
        dev: { ...defaultConfig },
        staging: { ...defaultConfig },
        prod: { ...defaultConfig },
      };
    }
  },

  /**
   * Delete saved configs for a template type
   * @param {string} templateType - The template type
   * @param {string} userId - Optional user ID
   */
  async deleteTemplateConfigs(templateType, userId = null) {
    try {
      let query = supabase
        .from('workflow_configs')
        .delete()
        .eq('template_type', templateType);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting template configs:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete template configs:', error);
      throw error;
    }
  },

  /**
   * Get recently used template configs
   * Useful for showing user their most common configurations
   * @param {string} userId - Optional user ID
   * @param {number} limit - Number of results to return
   */
  async getRecentTemplateConfigs(userId = null, limit = 10) {
    try {
      let query = supabase
        .from('workflow_configs')
        .select('template_type, template_version, last_used_at, configs')
        .order('last_used_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recent configs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get recent template configs:', error);
      return [];
    }
  },
};
