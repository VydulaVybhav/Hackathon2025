# Supabase Database Schema - Pipeline Express

This document outlines the database schema for Pipeline Express using a custom schema namespace.

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL below
4. Execute the query to create the custom schema and all tables

## SQL Schema

```sql
-- Create custom schema for Pipeline Express
CREATE SCHEMA IF NOT EXISTS "pipeline-express";

-- Workflows Table
CREATE TABLE "pipeline-express".workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  user_id TEXT,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  thumbnail TEXT
);

-- System Modules Table (Optional - for custom user modules)
CREATE TABLE "pipeline-express".system_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  user_id TEXT,
  is_public BOOLEAN DEFAULT false
);

-- Workflow Configs Table (for saving node configurations)
CREATE TABLE "pipeline-express".workflow_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES "pipeline-express".workflows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_workflows_user_id ON "pipeline-express".workflows(user_id);
CREATE INDEX idx_workflows_created_at ON "pipeline-express".workflows(created_at DESC);
CREATE INDEX idx_workflows_is_public ON "pipeline-express".workflows(is_public);
CREATE INDEX idx_system_modules_user_id ON "pipeline-express".system_modules(user_id);
CREATE INDEX idx_workflow_configs_workflow_id ON "pipeline-express".workflow_configs(workflow_id);

-- Enable Row Level Security (RLS)
ALTER TABLE "pipeline-express".workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pipeline-express".system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pipeline-express".workflow_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows
CREATE POLICY "Enable read access for all users" ON "pipeline-express".workflows
  FOR SELECT USING (is_public = true OR user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Enable insert for authenticated users only" ON "pipeline-express".workflows
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for users based on user_id" ON "pipeline-express".workflows
  FOR UPDATE USING (user_id = current_setting('request.jwt.claim.sub', true) OR user_id IS NULL);

CREATE POLICY "Enable delete for users based on user_id" ON "pipeline-express".workflows
  FOR DELETE USING (user_id = current_setting('request.jwt.claim.sub', true) OR user_id IS NULL);

-- RLS Policies for system_modules
CREATE POLICY "Enable read access for all users" ON "pipeline-express".system_modules
  FOR SELECT USING (is_public = true OR user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Enable insert for authenticated users only" ON "pipeline-express".system_modules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for users based on user_id" ON "pipeline-express".system_modules
  FOR UPDATE USING (user_id = current_setting('request.jwt.claim.sub', true) OR user_id IS NULL);

CREATE POLICY "Enable delete for users based on user_id" ON "pipeline-express".system_modules
  FOR DELETE USING (user_id = current_setting('request.jwt.claim.sub', true) OR user_id IS NULL);

-- RLS Policies for workflow_configs
CREATE POLICY "Enable read access for workflow owners" ON "pipeline-express".workflow_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "pipeline-express".workflows
      WHERE workflows.id = workflow_configs.workflow_id
      AND (workflows.user_id = current_setting('request.jwt.claim.sub', true) OR workflows.is_public = true OR workflows.user_id IS NULL)
    )
  );

CREATE POLICY "Enable insert for workflow owners" ON "pipeline-express".workflow_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "pipeline-express".workflows
      WHERE workflows.id = workflow_configs.workflow_id
      AND (workflows.user_id = current_setting('request.jwt.claim.sub', true) OR workflows.user_id IS NULL)
    )
  );

CREATE POLICY "Enable update for workflow owners" ON "pipeline-express".workflow_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "pipeline-express".workflows
      WHERE workflows.id = workflow_configs.workflow_id
      AND (workflows.user_id = current_setting('request.jwt.claim.sub', true) OR workflows.user_id IS NULL)
    )
  );

CREATE POLICY "Enable delete for workflow owners" ON "pipeline-express".workflow_configs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "pipeline-express".workflows
      WHERE workflows.id = workflow_configs.workflow_id
      AND (workflows.user_id = current_setting('request.jwt.claim.sub', true) OR workflows.user_id IS NULL)
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION "pipeline-express".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON "pipeline-express".workflows
  FOR EACH ROW EXECUTE FUNCTION "pipeline-express".update_updated_at_column();

CREATE TRIGGER update_workflow_configs_updated_at BEFORE UPDATE ON "pipeline-express".workflow_configs
  FOR EACH ROW EXECUTE FUNCTION "pipeline-express".update_updated_at_column();

-- Grant usage on schema to anon and authenticated users
GRANT USAGE ON SCHEMA "pipeline-express" TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA "pipeline-express" TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "pipeline-express" TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "pipeline-express" TO anon, authenticated;
```

## Verification Query

After running the schema, verify it was created correctly:

```sql
-- Check schema exists
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'pipeline-express';

-- Check tables in pipeline-express schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'pipeline-express';

-- Should return: workflows, system_modules, workflow_configs
```

## Table Descriptions

### `pipeline-express.workflows`
Stores complete workflow definitions including nodes and edges.

**Columns:**
- `id` - Unique identifier (UUID)
- `name` - Workflow name
- `description` - Optional workflow description
- `nodes` - JSON array of workflow nodes
- `edges` - JSON array of workflow connections
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `user_id` - Owner identifier (for multi-user support)
- `is_public` - Whether workflow is publicly visible
- `tags` - Array of tags for categorization
- `thumbnail` - Optional preview image URL

### `pipeline-express.system_modules`
Stores custom user-created node templates (extends default templates).

**Columns:**
- `id` - Unique identifier (UUID)
- `type` - Module type (trigger/action)
- `label` - Display name
- `description` - Module description
- `icon` - Icon identifier
- `config` - Default configuration JSON
- `created_at` - Creation timestamp
- `user_id` - Creator identifier
- `is_public` - Whether module is publicly available

### `pipeline-express.workflow_configs`
Stores individual node configurations within workflows.

**Columns:**
- `id` - Unique identifier (UUID)
- `workflow_id` - Reference to parent workflow
- `node_id` - Node identifier within workflow
- `config` - Node configuration JSON
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Benefits of Custom Schema

✅ **Better Organization** - Separates app data from other projects
✅ **Namespace Isolation** - Avoids conflicts with other tables
✅ **Clear Ownership** - Easy to identify Pipeline Express tables
✅ **Easy Migration** - Can export/import schema independently
✅ **Security** - Fine-grained access control per schema

## Notes

- All tables use Row Level Security (RLS) for data protection
- Anonymous users can create and manage workflows (user_id can be NULL)
- Policies are relaxed for anonymous users to allow localStorage-like behavior
- Timestamps are stored in UTC
- JSON fields allow flexible storage of workflow data
- The custom schema keeps everything organized under `pipeline-express`
