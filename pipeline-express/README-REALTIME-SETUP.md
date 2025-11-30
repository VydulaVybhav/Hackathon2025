# Real-time Workflow Execution Setup Guide

This guide explains how to set up real-time workflow execution tracking using Supabase Realtime and n8n.

## Architecture Overview

```
User clicks "Execute" in React UI
    ↓
React creates execution record in Supabase
    ↓
React triggers n8n via proxy webhook
    ↓
n8n receives workflow definition
    ↓
n8n executes each node sequentially
    ↓
n8n updates Supabase DB for each node status change
    ↓
Supabase Realtime broadcasts changes via WebSocket
    ↓
React UI subscribes and updates live
```

## Prerequisites

- ✅ Keycloak proxy already configured (from README-PROXY-SETUP.md)
- ✅ Supabase project with main schema created
- ✅ n8n instance running
- ✅ Service account credentials configured

## Step 1: Update Supabase Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run `SUPABASE_EXECUTION_SCHEMA.sql`

This creates:
- `workflow_executions` table - tracks each workflow run
- `node_executions` table - tracks individual node status
- Realtime publication for both tables
- RLS policies for access control

Verify with:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'pipeline-express'
  AND table_name IN ('workflow_executions', 'node_executions');
```

## Step 2: Enable Supabase Realtime

### In Supabase Dashboard:

1. Go to **Database → Replication**
2. Find `supabase_realtime` publication
3. Verify these tables are enabled:
   - `pipeline-express.workflow_executions`
   - `pipeline-express.node_executions`

If not enabled, run in SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime
  ADD TABLE "pipeline-express".workflow_executions;

ALTER PUBLICATION supabase_realtime
  ADD TABLE "pipeline-express".node_executions;
```

## Step 3: Configure n8n Workflow

### Import the Workflow

1. Open n8n dashboard
2. Click **Workflows** → **Import from File**
3. Select `n8n-workflow-executor.json`

### Configure Credentials

1. **Supabase PostgreSQL Connection**:
   - Click on any Postgres node
   - Add new credentials:
     - **Host**: Your Supabase project database host
       (find in Supabase: Settings → Database → Connection String)
     - **Database**: `postgres`
     - **User**: `postgres`
     - **Password**: Your database password
     - **Port**: `5432`
     - **SSL**: Enable

2. **Environment Variables** (in n8n settings):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

### Update Credential IDs

In the workflow JSON, replace `YOUR_SUPABASE_CREDENTIALS_ID` with your actual credential ID.

### Activate the Workflow

1. Save the workflow
2. Click **Active** toggle to enable
3. Note the webhook URL (should be: `http://your-n8n/webhook/execute-workflow`)

## Step 4: Configure Proxy for n8n

Update your `.env` file:

```bash
# n8n Configuration
REACT_APP_N8N_WEBHOOK_URL=http://your-n8n-instance:5678/webhook
```

Ensure proxy is configured to forward webhook requests (already done in `proxy-server.js`).

## Step 5: Test the Setup

### Test 1: Database Connection

In Supabase SQL Editor:
```sql
-- Insert test execution
INSERT INTO "pipeline-express".workflow_executions
  (workflow_id, status)
VALUES
  (gen_random_uuid(), 'pending')
RETURNING *;

-- Verify
SELECT * FROM "pipeline-express".workflow_executions
ORDER BY started_at DESC
LIMIT 1;
```

### Test 2: Realtime Subscription

In browser console:
```javascript
// This code runs automatically via useWorkflowExecution hook
// You can check the Network tab for WebSocket connections
// Look for: wss://your-project.supabase.co/realtime/v1/websocket
```

### Test 3: Full Workflow Execution

1. Start proxy server: `npm run proxy`
2. Start React app: `npm start`
3. Create a simple workflow in the UI
4. Click "Execute Flow"
5. Watch nodes update in real-time!

Check browser console for logs:
```
Creating execution record...
Execution created: <uuid>
Triggering n8n workflow...
n8n workflow triggered successfully
Subscribing to execution: <uuid>
Subscription status: SUBSCRIBED
Node execution update received: {...}
```

## How It Works

### React Side (Frontend)

1. **Create Execution** (`useWorkflow.js:executeWorkflow()`):
   ```javascript
   const execution = await executionService.createExecution(workflowId);
   setCurrentExecutionId(execution.id);
   ```

2. **Subscribe to Updates** (`useWorkflowExecution.js`):
   ```javascript
   const channel = supabase.channel(`execution:${executionId}`)
     .on('postgres_changes', { table: 'node_executions' }, (payload) => {
       setNodeStatuses(prev => ({ ...prev, [payload.new.node_id]: payload.new }));
     })
     .subscribe();
   ```

3. **Update UI** (`useWorkflow.js` useEffect):
   ```javascript
   setNodes(nds => nds.map(node => ({
     ...node,
     data: { ...node.data, status: nodeStatuses[node.id]?.status }
   })));
   ```

### n8n Side (Backend)

1. **Receive Webhook** - Get execution_id and workflow definition
2. **Mark Running** - `UPDATE workflow_executions SET status='running'`
3. **Create Node Records** - `INSERT INTO node_executions`
4. **Execute Each Node**:
   ```javascript
   for (const node of nodes) {
     // Update to 'running'
     PATCH /node_executions?node_id=eq.{id} { status: 'running' }

     // Execute logic
     await executeNodeLogic(node);

     // Update to 'success'
     PATCH /node_executions?node_id=eq.{id} { status: 'success' }
   }
   ```
5. **Mark Complete** - `UPDATE workflow_executions SET status='completed'`

## Troubleshooting

### Realtime Not Working

**Check WebSocket Connection**:
- Open browser DevTools → Network → WS
- Look for connection to `wss://your-project.supabase.co/realtime/v1/websocket`
- Should show status: `101 Switching Protocols`

**Check Subscription Status**:
```javascript
// In browser console
console.log('Subscription active:', supabase.getChannels());
```

**Verify Realtime is Enabled**:
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

### n8n Not Updating Database

**Check n8n Logs**:
```bash
# In n8n container/instance
n8n logs
```

**Verify Supabase Connection**:
- Test PostgreSQL node in n8n
- Run simple query: `SELECT 1;`

**Check Authentication**:
- Ensure service account token is valid
- Verify RLS policies allow inserts/updates

### Proxy Issues

**Webhook Not Reaching n8n**:
```bash
# Test directly
curl -X POST http://localhost:3001/webhook/execute-workflow \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"execution_id":"test","nodes":[]}'
```

**Check Proxy Logs**:
```
Proxying to n8n webhook: http://n8n:5678/webhook/execute-workflow
```

## Performance Considerations

### Realtime Connection Limits

- Supabase Free tier: 200 concurrent connections
- Each execution creates 1 WebSocket connection
- Connections auto-close when execution completes

### Database Load

- Each node execution = 2-3 UPDATE queries
- Use indexes (already created in schema)
- Consider batching for large workflows (>50 nodes)

### n8n Execution

- Sequential node execution (one at a time)
- Each node adds ~1 second delay (configurable)
- For parallel execution, modify n8n workflow logic

## Security Notes

### RLS Policies

Current policies are permissive (`USING (true)`). For production:

```sql
-- Restrict to authenticated users only
CREATE POLICY "Authenticated users only"
ON "pipeline-express".workflow_executions
FOR ALL
USING (auth.uid() IS NOT NULL);
```

### Service Account

- n8n uses service account credentials
- Store securely in n8n environment variables
- Rotate credentials regularly

### WebSocket Authentication

- Supabase Realtime uses same anon key as REST API
- Consider upgrading to authenticated users for production
- Use Row Level Security for user isolation

## Next Steps

- [ ] Add execution history UI
- [ ] Implement execution retry
- [ ] Add execution pause/resume
- [ ] Create execution analytics dashboard
- [ ] Set up execution notifications
- [ ] Add execution logs streaming

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [n8n Webhook Nodes](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [React Flow Docs](https://reactflow.dev/)
