/**
 * Application-wide constants
 * Centralizes all hardcoded values for easier maintenance
 */

// Timing Constants
export const TIMING = {
  EXECUTION_NODE_DELAY: 1200, // ms - delay between executing nodes in workflow
  RESET_DELAY: 3000, // ms - delay before resetting workflow state
  AI_RESPONSE_DELAY: 1000, // ms - simulated AI response delay in chatbox
  TRANSITION_DURATION: 300, // ms - standard CSS transition duration
};

// Layout Constants
export const LAYOUT = {
  SIDEBAR_WIDTH: 320, // px - workflow builder sidebar width
  NODE_MIN_WIDTH: 280, // px - minimum node width
  HEADER_HEIGHT: 60, // px - navbar height
};

// Node Spawning Area
export const NODE_SPAWN_AREA = {
  MIN_X: 100,
  MAX_X: 400,
  MIN_Y: 100,
  MAX_Y: 300,
};

// Status Colors (matching workflowUtils.js)
export const STATUS_COLORS = {
  ERROR: '#ff4444',
  RUNNING: '#ffaa00',
  SUCCESS: '#00ff41',
  DEFAULT: '#666',
};

// Status Text
export const STATUS_TEXT = {
  RUNNING: 'Active',
  IDLE: 'Ready',
  EXECUTING: 'Executing...',
  EXECUTE: 'Execute Flow',
};

// Button Text
export const BUTTON_TEXT = {
  HOME: 'Home',
  THEME: 'Theme',
  UPDATE: 'Update',
  SAVE: 'Save',
  SAVING: 'Saving...',
  SAVE_WORKFLOW: 'Save Workflow',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  EXECUTE_FLOW: 'Execute Flow',
  EXECUTING: 'Executing...',
  CREATE_NEW_WORKFLOW: 'Create New Workflow',
};

// Error Messages
export const ERROR_MESSAGES = {
  WORKFLOW_UPDATE_FAILED: 'Failed to update workflow',
  WORKFLOW_SAVE_FAILED: 'Failed to save workflow',
  WORKFLOW_LOAD_FAILED: 'Failed to load workflow',
  WORKFLOW_LOAD_ALL_FAILED: 'Failed to load workflows. Please try again.',
  WORKFLOW_DELETE_FAILED: 'Failed to delete workflow',
  INVALID_WORKFLOW_NAME: 'Please enter a valid workflow name',
  MISSING_ADO_CONFIG: 'Azure DevOps configuration is missing. Please check your environment variables.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  WORKFLOW_SAVED: 'Workflow saved successfully',
  WORKFLOW_UPDATED: 'Workflow updated successfully',
  WORKFLOW_DELETED: 'Workflow deleted successfully',
};

// Azure DevOps Configuration
export const ADO_CONFIG = {
  API_VERSION: '7.0',
  DEFAULT_MODULES_PATH: 'modules',
  DEFAULT_BRANCH: 'main',
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  DEFAULT_SCHEMA: 'pipeline-express',
};

// Workflow Defaults
export const WORKFLOW_DEFAULTS = {
  DESCRIPTION_TEMPLATE: (nodeCount) => `Workflow with ${nodeCount} nodes`,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
};

// Responsive Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768, // px
  TABLET: 1024, // px
  DESKTOP: 1440, // px
};

// Animation Durations
export const ANIMATIONS = {
  GLOW_DURATION: 2000, // ms
  PULSE_DURATION: 1500, // ms
  FADE_DURATION: 300, // ms
};

// Z-Index Layers
export const Z_INDEX = {
  HEADER: 1000,
  MODAL: 2000,
  TOAST: 3000,
  TOOLTIP: 4000,
};

// Node Configuration
export const NODE_CONFIG = {
  STATUS_INDICATOR_SIZE: 8, // px
  HANDLE_SIZE: 12, // px
  DEFAULT_ZOOM: 1,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2,
};

// Confirmation Messages
export const CONFIRM_MESSAGES = {
  DELETE_WORKFLOW: (name) => `Are you sure you want to delete "${name}"?`,
  DISCARD_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
};

// Placeholder Text
export const PLACEHOLDERS = {
  SEARCH_WORKFLOWS: 'Search workflows...',
  WORKFLOW_NAME: 'Enter workflow name...',
  WORKFLOW_DESCRIPTION: 'Enter workflow description...',
  CHAT_MESSAGE: 'Ask me anything about workflows...',
};

// Empty State Messages
export const EMPTY_STATE = {
  NO_WORKFLOWS: 'No workflows found',
  NO_SEARCH_RESULTS: 'No workflows match your search criteria',
  CREATE_FIRST: 'Create your first workflow to get started',
};

// Loading Messages
export const LOADING_MESSAGES = {
  WORKFLOWS: 'Loading workflows...',
  MODULES: 'Loading modules...',
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
};

// Confirmation Dialog Text
export const CONFIRM_DIALOG = {
  DELETE_TITLE: 'Delete Workflow',
  DELETE_CONFIRM_TEXT: 'Delete',
  CANCEL_TEXT: 'Cancel',
};
