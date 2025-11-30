-- Environment-Specific Node Configuration Schema
-- Uses ADO templates as source of truth for parameters
-- Stores user's saved values per template type and environment

-- Drop existing workflow_configs table and recreate with new structure
DROP TABLE IF EXISTS "pipeline-express".workflow_configs CASCADE;

CREATE TABLE "pipeline-express".workflow_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Template identification (from ADO)
  template_type TEXT NOT NULL,           -- e.g., "deploy", "test", "build"
  template_version TEXT DEFAULT 'latest', -- Track template version for migration

  -- Environment-specific configs stored as JSONB
  -- Structure: { "dev": {...params}, "staging": {...params}, "prod": {...params} }
  configs JSONB DEFAULT '{
    "dev": {},
    "staging": {},
    "prod": {}
  }'::jsonb,

  -- Metadata
  user_id TEXT,                          -- Optional: track which user saved these configs
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Ensure one config record per template type per user
  UNIQUE(template_type, user_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_workflow_configs_template ON "pipeline-express".workflow_configs(template_type);
CREATE INDEX idx_workflow_configs_user ON "pipeline-express".workflow_configs(user_id);
CREATE INDEX idx_workflow_configs_last_used ON "pipeline-express".workflow_configs(last_used_at DESC);

-- Enable Row Level Security
ALTER TABLE "pipeline-express".workflow_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all for now (tighten in production)
CREATE POLICY "Allow all access to workflow_configs"
  ON "pipeline-express".workflow_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION "pipeline-express".update_workflow_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on config changes
CREATE TRIGGER workflow_configs_updated_at
  BEFORE UPDATE ON "pipeline-express".workflow_configs
  FOR EACH ROW
  EXECUTE FUNCTION "pipeline-express".update_workflow_config_updated_at();

-- Example data showing how configs are stored
COMMENT ON TABLE "pipeline-express".workflow_configs IS
'Stores environment-specific configurations for node templates.
Configs are keyed by template_type (from ADO) rather than individual node_id.
When a user creates a new node from a template, the system checks for saved configs
and auto-fills parameters with previously used values for the selected environment.';

-- Example query to get configs for a template
COMMENT ON COLUMN "pipeline-express".workflow_configs.configs IS
'JSONB structure example:
{
  "dev": {
    "api_url": "https://dev-api.example.com",
    "timeout": "10",
    "replicas": "1"
  },
  "staging": {
    "api_url": "https://staging-api.example.com",
    "timeout": "20",
    "replicas": "2"
  },
  "prod": {
    "api_url": "https://api.example.com",
    "timeout": "30",
    "replicas": "3"
  }
}';
