import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Environment Context - Manages the currently selected environment
 * Supports custom environments and persists in localStorage
 */
const EnvironmentContext = createContext({
  currentEnv: 'dev',
  setCurrentEnv: () => {},
  availableEnvs: ['dev', 'staging', 'prod'],
  addEnvironment: () => {},
  removeEnvironment: () => {},
});

/**
 * Environment Provider Component
 * Wraps the app to provide environment state globally
 */
export const EnvironmentProvider = ({ children }) => {
  const DEFAULT_ENVS = ['dev', 'staging', 'prod'];

  // Initialize available environments from localStorage
  const [availableEnvs, setAvailableEnvs] = useState(() => {
    const saved = localStorage.getItem('available_environments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure default envs are always included
        const merged = [...new Set([...DEFAULT_ENVS, ...parsed])];
        return merged;
      } catch (e) {
        return DEFAULT_ENVS;
      }
    }
    return DEFAULT_ENVS;
  });

  // Initialize current environment from localStorage
  const [currentEnv, setCurrentEnvState] = useState(() => {
    const saved = localStorage.getItem('selected_environment');
    return saved && availableEnvs.includes(saved) ? saved : 'dev';
  });

  // Persist environment selection to localStorage
  useEffect(() => {
    localStorage.setItem('selected_environment', currentEnv);
  }, [currentEnv]);

  // Persist available environments to localStorage
  useEffect(() => {
    localStorage.setItem('available_environments', JSON.stringify(availableEnvs));
  }, [availableEnvs]);

  // Wrapper to validate environment before setting
  const setCurrentEnv = (env) => {
    if (availableEnvs.includes(env)) {
      setCurrentEnvState(env);
    } else {
      console.warn(`Invalid environment: ${env}. Must be one of:`, availableEnvs);
    }
  };

  // Add a new custom environment
  const addEnvironment = (envName) => {
    const normalized = envName.toLowerCase().trim();
    if (!normalized) {
      console.warn('Environment name cannot be empty');
      return;
    }
    if (availableEnvs.includes(normalized)) {
      console.warn(`Environment ${normalized} already exists`);
      return;
    }
    setAvailableEnvs((prev) => [...prev, normalized]);
  };

  // Remove a custom environment
  const removeEnvironment = (envName) => {
    if (DEFAULT_ENVS.includes(envName)) {
      console.warn(`Cannot remove default environment: ${envName}`);
      return;
    }
    if (envName === currentEnv) {
      console.warn(`Cannot remove currently active environment: ${envName}`);
      return;
    }
    setAvailableEnvs((prev) => prev.filter((env) => env !== envName));
  };

  const value = {
    currentEnv,
    setCurrentEnv,
    availableEnvs,
    addEnvironment,
    removeEnvironment,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};

/**
 * Hook to access environment context
 * @returns {{ currentEnv: string, setCurrentEnv: Function, availableEnvs: string[] }}
 */
export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);

  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }

  return context;
};

export default EnvironmentContext;
