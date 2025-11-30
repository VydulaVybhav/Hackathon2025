-- Supabase Schema for Workflow Execution Tracking
-- Run this in Supabase SQL Editor after the main schema is created

-- Workflow Executions Table
-- Tracks each workflow execution instance
CREATE TABLE "pipeline-express".workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES "pipeline-express".workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  user_id TEXT
);

-- Node Execution Status Table
-- Tracks individual node execution within a workflow run
CREATE TABLE "pipeline-express".node_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID REFERENCES "pipeline-express".workflow_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, error
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  output_data JSONB,
  error_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_executions_workflow_id ON "pipeline-express".workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON "pipeline-express".workflow_executions(status);
CREATE INDEX idx_executions_started_at ON "pipeline-express".workflow_executions(started_at DESC);
CREATE INDEX idx_node_executions_execution_id ON "pipeline-express".node_executions(execution_id);
CREATE INDEX idx_node_executions_node_id ON "pipeline-express".node_executions(node_id);

-- Enable Realtime for these tables
-- IMPORTANT: This allows Supabase to broadcast changes via WebSocket
ALTER PUBLICATION supabase_realtime ADD TABLE "pipeline-express".workflow_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE "pipeline-express".node_executions;

-- Enable Row Level Security (RLS)
ALTER TABLE "pipeline-express".workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pipeline-express".node_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_executions
-- Permissive policies for development - tighten for production
CREATE POLICY "Allow all to read executions" ON "pipeline-express".workflow_executions
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert executions" ON "pipeline-express".workflow_executions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update executions" ON "pipeline-express".workflow_executions
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete executions" ON "pipeline-express".workflow_executions
  FOR DELETE USING (true);

-- RLS Policies for node_executions
CREATE POLICY "Allow all to read node executions" ON "pipeline-express".node_executions
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert node executions" ON "pipeline-express".node_executions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update node executions" ON "pipeline-express".node_executions
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete node executions" ON "pipeline-express".node_executions
  FOR DELETE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION "pipeline-express".update_node_execution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on node_executions
CREATE TRIGGER update_node_executions_updated_at
  BEFORE UPDATE ON "pipeline-express".node_executions
  FOR EACH ROW
  EXECUTE FUNCTION "pipeline-express".update_node_execution_timestamp();

-- Grant permissions
GRANT ALL ON "pipeline-express".workflow_executions TO anon, authenticated;
GRANT ALL ON "pipeline-express".node_executions TO anon, authenticated;

-- Verification Query
-- Run this to confirm tables were created successfully
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'pipeline-express'
  AND table_name IN ('workflow_executions', 'node_executions');

-- Sample Query to Test Realtime
-- You can use this to verify realtime is working
-- SELECT * FROM "pipeline-express".workflow_executions;
-- SELECT * FROM "pipeline-express".node_executions;

-- Clean up old executions (optional - run manually or schedule)
-- DELETE FROM "pipeline-express".workflow_executions
-- WHERE started_at < NOW() - INTERVAL '30 days';
