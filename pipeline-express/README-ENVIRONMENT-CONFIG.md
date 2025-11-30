# Environment-Specific Node Configuration

This guide explains how to use the environment-specific configuration system for workflow nodes.

## Overview

The Pipeline Express environment configuration system allows you to:
- Configure workflow nodes differently for **dev**, **staging**, and **prod** environments
- Auto-populate configuration fields from **ADO template parameters**
- Save and reuse configurations across workflows
- Switch between environments in real-time to see different configurations

## How It Works

### 1. ADO Templates as Source of Truth

Instead of manually creating configuration fields, the system uses your **Azure DevOps module templates** to automatically generate the config UI.

**Example ADO Template** (`modules/deploy.yaml`):
```yaml
type: deploy
label: Deploy Service
description: Deploy a service to Kubernetes
parameters:
  - name: api_url
    description: API endpoint URL
    default: https://api.example.com
  - name: timeout
    description: Request timeout in seconds
    default: "30"
  - name: replicas
    description: Number of replicas
    default: "3"
```

When you add this module to your workflow, the system:
1. Reads the `parameters` array from the template
2. Creates input fields for each parameter
3. Checks if you've saved configs for this template before
4. Auto-fills fields with your previously saved values (or uses template defaults)

### 2. Environment-Specific Storage

Configurations are stored **per template type** (not per individual node instance).

**Database Structure** (`workflow_configs` table):
```
template_type  | configs (JSONB)
-------------  | ------------------------------------------------
deploy         | {
               |   "dev": { "api_url": "https://dev.api...", ... },
               |   "staging": { "api_url": "https://staging.api...", ... },
               |   "prod": { "api_url": "https://api...", ... }
               | }
test           | { "dev": {...}, "staging": {...}, "prod": {...} }
```

This means:
- ✅ When you create a new "Deploy" node, it auto-fills with your last saved "deploy" configs
- ✅ Each environment (dev/staging/prod) has separate values
- ✅ Configs persist across workflows
- ✅ Adding new parameters in ADO automatically shows new fields

## User Guide

### Setting Up Database

1. Run the schema migration in Supabase SQL Editor:
```sql
-- Located at: pipeline-express/SUPABASE_CONFIG_SCHEMA.sql
```

This creates the `workflow_configs` table.

### Using the Environment Selector

1. Open the Workflow Builder
2. Look for the **Environment Selector** in the top-right corner
3. Select your target environment: **Dev**, **Staging**, or **Prod**
4. All nodes update to show configs for the selected environment

![Environment Selector](docs/env-selector.png)

**Environment Indicators:**
- 🔧 **Dev** - Green (#00ff9f)
- 🧪 **Staging** - Gold (#ffd700)
- 🚀 **Prod** - Pink (#ff0080)

Each node shows a small colored badge indicating the current environment.

### Configuring Nodes

#### Step 1: Add a Node from Module Panel
1. Click a module template in the left sidebar
2. The node is created with:
   - Template default values (from ADO YAML)
   - OR your previously saved values for this template type

#### Step 2: Configure for Current Environment
1. Click the node to open the **Config Panel** (right sidebar)
2. You'll see:
   - **Module Type** - Read-only template name
   - **Environment Header** - Shows which environment you're configuring
   - **Parameter Fields** - Auto-generated from ADO template

**Example Config Panel:**
```
┌─────────────────────────────────────┐
│  Settings Module Config        [X]  │
├─────────────────────────────────────┤
│ Module Type                         │
│ Deploy Service                      │
├─────────────────────────────────────┤
│ [Current Environment] [All Envs]    │
├─────────────────────────────────────┤
│ Configuring for: DEVELOPMENT        │
│                                     │
│ api_url                         ℹ️  │
│ [https://dev-api.example.com]      │
│ Default: https://api.example.com   │
│                                     │
│ timeout                         ℹ️  │
│ [10]                                │
│ Default: 30                         │
│                                     │
│ replicas                        ℹ️  │
│ [1]                                 │
│ Default: 3                          │
└─────────────────────────────────────┘
```

#### Step 3: Switch Environments to Configure All
1. Click **"All Environments"** tab in Config Panel
2. See side-by-side view of all environments:

```
┌─── Dev ──────┬─── Staging ──┬─── Prod ─────┐
│ api_url      │ api_url      │ api_url      │
│ [dev-api...] │ [stage-api...]│ [api...]    │
│              │              │              │
│ timeout      │ timeout      │ timeout      │
│ [10]         │ [20]         │ [30]         │
│              │              │              │
│ replicas     │ replicas     │ replicas     │
│ [1]          │ [2]          │ [3]          │
└──────────────┴──────────────┴──────────────┘
```

#### Step 4: Auto-Save
- Changes are **automatically saved** to the database as you type
- Saved configs apply to ALL future nodes of the same template type

### Executing Workflows

1. Select the target environment using the **Environment Selector**
2. Click **"Execute Flow"**
3. The workflow runs with the selected environment's configuration
4. Execution record includes `environment` metadata

**Example:**
```javascript
// Execution creates record with environment
{
  id: "uuid-123",
  workflow_id: "uuid-456",
  environment: "prod",  // ← Tracks which env was used
  status: "running",
  ...
}
```

### Viewing Node Configs

Each node displays its **current environment's config** in the node body:

```
┌───────────────────────────────────┐
│  📦 Deploy Service            [P] │ ← Environment badge (P=Prod)
├───────────────────────────────────┤
│ api_url: https://api.example.com  │
│ timeout: 30                       │
│ replicas: 3                       │
└───────────────────────────────────┘
```

When you switch environments, all nodes update to show the new environment's values.

## Technical Details

### Data Flow

```
ADO Template YAML
    ↓
parseModuleYaml() → extracts parameters
    ↓
User adds node to workflow
    ↓
configService.initializeNodeConfigs()
    ↓
Query database for saved configs (template_type = "deploy")
    ↓
Merge saved values with template defaults
    ↓
Node created with env_configs: { dev: {...}, staging: {...}, prod: {...} }
    ↓
User edits config in ConfigPanel
    ↓
configService.saveTemplateConfig()
    ↓
Upsert to workflow_configs table
```

### Key Files

**Backend/Database:**
- `SUPABASE_CONFIG_SCHEMA.sql` - Database schema for environment configs
- `src/services/configService.js` - CRUD operations for configs

**Frontend Components:**
- `src/context/EnvironmentContext.jsx` - Environment state management
- `src/components/EnvironmentSelector.jsx` - Environment dropdown
- `src/components/workflow/ConfigPanel.jsx` - Config editor with env support
- `src/components/workflow/CustomNode.jsx` - Displays environment badge
- `src/hooks/useWorkflow.js` - Environment-aware node management

**Styles:**
- `src/styles/EnvironmentSelector.css` - Environment selector styles
- `src/components/workflow/ConfigPanel.css` - Config panel styles
- `src/components/WorkflowBuilder.css` - Node environment badge styles

### API Reference

#### `configService`

**`getTemplateConfigs(templateType, userId?)`**
```javascript
// Get saved configs for a template type
const configs = await configService.getTemplateConfigs('deploy');
// Returns: { dev: {...}, staging: {...}, prod: {...} }
```

**`saveTemplateConfig(templateType, environment, configValues, userId?)`**
```javascript
// Save config for a specific environment
await configService.saveTemplateConfig('deploy', 'dev', {
  api_url: 'https://dev-api.example.com',
  timeout: '10'
});
```

**`initializeNodeConfigs(templateType, templateParameters, userId?)`**
```javascript
// Initialize configs for a new node (merges saved + defaults)
const envConfigs = await configService.initializeNodeConfigs(
  'deploy',
  [{ name: 'api_url', default: 'https://api.example.com' }, ...]
);
```

**`mergeWithDefaults(templateParameters, savedConfigs)`**
```javascript
// Merge template defaults with user-saved values
const merged = configService.mergeWithDefaults(
  [{ name: 'timeout', default: '30' }],
  { timeout: '10' }
);
// Returns: { timeout: '10' } (saved value takes precedence)
```

#### `useEnvironment` Hook

```javascript
import { useEnvironment } from '../context/EnvironmentContext';

function MyComponent() {
  const { currentEnv, setCurrentEnv, availableEnvs } = useEnvironment();

  return (
    <div>
      Current: {currentEnv}
      <button onClick={() => setCurrentEnv('prod')}>Switch to Prod</button>
    </div>
  );
}
```

### Node Data Structure

```javascript
{
  id: "node_abc123",
  type: "customNode",
  position: { x: 100, y: 200 },
  data: {
    // Template metadata
    type: "deploy",
    label: "Deploy Service",
    description: "Deploy a service to Kubernetes",
    templateType: "deploy",  // For config lookups

    // Original ADO parameters (kept for reference)
    _parameters: [
      { name: "api_url", default: "https://api.example.com", description: "..." },
      { name: "timeout", default: "30", description: "..." },
      { name: "replicas", default: "3", description: "..." }
    ],

    // Environment-specific configs
    env_configs: {
      dev: {
        api_url: "https://dev-api.example.com",
        timeout: "10",
        replicas: "1"
      },
      staging: {
        api_url: "https://staging-api.example.com",
        timeout: "20",
        replicas: "2"
      },
      prod: {
        api_url: "https://api.example.com",
        timeout: "30",
        replicas: "3"
      }
    },

    // Current displayed config (matches selected environment)
    config: { api_url: "https://dev-api.example.com", timeout: "10", replicas: "1" },

    // Execution state
    status: "idle"
  }
}
```

## Handling Template Updates

### When ADO Template Parameters Change

**Scenario 1: New Parameter Added**
```yaml
# Old template
parameters:
  - name: api_url
  - name: timeout

# New template (added 'replicas')
parameters:
  - name: api_url
  - name: timeout
  - name: replicas  # ← NEW
    default: "3"
```

**What happens:**
1. User adds new "deploy" node to workflow
2. System fetches updated template from ADO
3. `initializeNodeConfigs()` finds 3 parameters
4. Checks database for saved configs (only has `api_url`, `timeout`)
5. Merges: `{ api_url: <saved>, timeout: <saved>, replicas: "3" <default> }`
6. Config Panel shows all 3 fields (including new one with default)

**Scenario 2: Parameter Removed**
```yaml
# Old template
parameters:
  - name: api_url
  - name: timeout
  - name: old_param  # ← Will be removed

# New template
parameters:
  - name: api_url
  - name: timeout
```

**What happens:**
1. Saved configs still have `old_param` value
2. New nodes ignore `old_param` (not in template)
3. Config Panel only shows fields from current template
4. Old saved value remains in database (backward compatible)

### Migrating Configs

If you need to rename/migrate parameters:

```javascript
// Migration script example
import { supabase } from './config/supabase';

async function migrateConfigs() {
  const { data: configs } = await supabase
    .from('workflow_configs')
    .select('*')
    .eq('template_type', 'deploy');

  for (const config of configs) {
    // Rename parameter across all environments
    ['dev', 'staging', 'prod'].forEach(env => {
      if (config.configs[env].old_param_name) {
        config.configs[env].new_param_name = config.configs[env].old_param_name;
        delete config.configs[env].old_param_name;
      }
    });

    // Update in database
    await supabase
      .from('workflow_configs')
      .update({ configs: config.configs })
      .eq('id', config.id);
  }
}
```

## Best Practices

### 1. Template Design
- ✅ Provide sensible defaults in ADO YAML
- ✅ Use descriptive parameter names (`api_url` not `url1`)
- ✅ Add descriptions for complex parameters
- ✅ Keep parameters environment-agnostic (names should be same across envs)

**Good:**
```yaml
parameters:
  - name: api_endpoint
    description: Base URL for the API server
    default: https://api.example.com
```

**Bad:**
```yaml
parameters:
  - name: url  # Too vague
    default: ""  # No default
```

### 2. Configuration Management
- ✅ Configure dev environment first (most permissive)
- ✅ Copy dev → staging → prod (then adjust)
- ✅ Use "All Environments" view to spot inconsistencies
- ✅ Document why environments differ (e.g., prod has higher timeouts)

### 3. Execution
- ✅ Always verify environment selector before executing
- ✅ Use dev for testing workflows
- ✅ Use staging for pre-production validation
- ✅ Use prod for live deployments

### 4. Team Collaboration
- ✅ Export workflow configs as documentation
- ✅ Use consistent naming conventions
- ✅ Review prod configs in team meetings
- ⚠️ Be careful with secrets (use environment variables, not hardcoded values)

## Troubleshooting

### Problem: Configs not saving

**Check:**
1. Database connection - Verify Supabase is accessible
2. Browser console - Look for errors from `configService`
3. RLS policies - Ensure `workflow_configs` table allows inserts

**Fix:**
```sql
-- Verify RLS policy
SELECT * FROM pg_policies WHERE tablename = 'workflow_configs';

-- If missing, add permissive policy (for development)
CREATE POLICY "Allow all" ON "pipeline-express".workflow_configs
FOR ALL USING (true) WITH CHECK (true);
```

### Problem: New parameters not showing

**Check:**
1. ADO connection - Verify templates are loading
2. Template structure - Ensure `parameters` array exists in YAML
3. Browser cache - Hard refresh (Ctrl+Shift+R)

**Fix:**
```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Problem: Wrong environment configs displayed

**Check:**
1. Environment selector - Verify selected environment
2. Node data - Inspect node in React DevTools
3. Context provider - Ensure `EnvironmentProvider` wraps app

**Fix:**
```javascript
// Check current environment in console
import { useEnvironment } from './context/EnvironmentContext';
const { currentEnv } = useEnvironment();
console.log('Current environment:', currentEnv);
```

### Problem: Configs lost after workflow load

**Check:**
1. Workflow save format - Ensure `env_configs` is saved
2. Node deserialization - Verify `_parameters` is preserved

**Fix in `useWorkflowStorage.js`:**
```javascript
// Ensure env_configs is saved
const saveWorkflow = async (workflow) => {
  const { data, error } = await supabase
    .from('workflows')
    .insert({
      ...workflow,
      nodes: workflow.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          env_configs: node.data.env_configs,  // ← Explicitly save
          _parameters: node.data._parameters    // ← Explicitly save
        }
      }))
    });
};
```

## Security Considerations

### Sensitive Data

**Don't store secrets in configs:**
```javascript
// ❌ BAD - Secrets in database
{
  api_key: "sk_live_abc123...",
  password: "mysecretpass"
}

// ✅ GOOD - Reference environment variables
{
  api_key: "${API_KEY}",  // Resolved at runtime from env vars
  password: "${DB_PASSWORD}"
}
```

### Row Level Security

For production, restrict config access by user:

```sql
-- Enable RLS
ALTER TABLE "pipeline-express".workflow_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own configs
CREATE POLICY "User owns configs"
ON "pipeline-express".workflow_configs
FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Service account can access all
CREATE POLICY "Service account access"
ON "pipeline-express".workflow_configs
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
```

### Audit Trail

Track config changes:

```sql
-- Add audit columns
ALTER TABLE "pipeline-express".workflow_configs
ADD COLUMN created_by TEXT,
ADD COLUMN updated_by TEXT;

-- Trigger to track updates
CREATE OR REPLACE FUNCTION track_config_changes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER config_audit
BEFORE UPDATE ON "pipeline-express".workflow_configs
FOR EACH ROW EXECUTE FUNCTION track_config_changes();
```

## Next Steps

- [ ] Add config export/import (YAML/JSON)
- [ ] Implement config diff viewer (compare environments)
- [ ] Add config validation rules per template
- [ ] Support environment promotion (dev → staging → prod)
- [ ] Integrate with secret management (HashiCorp Vault, AWS Secrets Manager)
- [ ] Add config history/versioning
- [ ] Support config inheritance (base config + environment overrides)

## References

- [ADO Service Integration](./src/services/adoService.js)
- [Supabase Database Schema](./SUPABASE_CONFIG_SCHEMA.sql)
- [Real-time Execution Setup](./README-REALTIME-SETUP.md)
- [Keycloak Proxy Setup](./README-PROXY-SETUP.md)
