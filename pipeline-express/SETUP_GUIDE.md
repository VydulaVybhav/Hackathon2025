# Pipeline Express - Supabase Setup Guide

## 🚀 Quick Start

### Step 1: Configure Azure DevOps (REQUIRED)
**⚠️ The app requires ADO configuration to load system modules.**

Load system module definitions from YAML files in Azure DevOps. See **[ADO_MODULES_GUIDE.md](./ADO_MODULES_GUIDE.md)** for detailed setup instructions.

Without ADO configured, the WorkflowBuilder will show an error and no modules will be available.

### Step 2: Set Up Supabase (Optional)
For cloud storage, multi-device access, and database features.

Without Supabase, workflows are saved to browser localStorage:
- Data persists across sessions
- Limited to single device/browser

---

## 📋 Supabase Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: Pipeline Express
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
5. Click **"Create new project"**

### Step 2: Create Database Schema and Tables

1. In your Supabase dashboard, go to the **SQL Editor**
2. Open `SUPABASE_SCHEMA.md` in this repository
3. Copy the entire SQL schema
4. Paste it into the SQL Editor
5. Click **"Run"** to execute the schema

This will create:
- **`pipeline-express` schema** - Custom namespace for all app tables
- `pipeline-express.workflows` table - Stores workflow definitions
- `pipeline-express.system_modules` table - Custom node templates
- `pipeline-express.workflow_configs` table - Node configurations
- All necessary indexes and security policies

**Benefits of custom schema:**
- ✅ Better organization and namespace isolation
- ✅ No conflicts with other projects in same Supabase instance
- ✅ Easy to identify and manage Pipeline Express data
- ✅ Simplified migrations and backups

### Step 3: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 4: Configure Environment Variables

1. In the `pipeline-express` folder, create a file named `.env`
2. Copy the contents from `.env.example`:

```env
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Replace the values with your actual credentials from Step 3
4. Save the file

**Important:** Never commit your `.env` file to version control!

### Step 5: Restart the Development Server

If your app is running, restart it:

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm start
```

---

## ✅ Verify Setup

1. Go to the **Builder** page
2. Create a simple workflow with a few nodes
3. Click the **"Save"** button
4. Enter a name and save
5. Go to **"Saved Workflows"** page
6. Your workflow should appear there!

To verify in Supabase:
- Go to **Table Editor** in Supabase dashboard
- From the schema dropdown, select **"pipeline-express"**
- Select the `workflows` table
- You should see your saved workflow

**Note:** Make sure to select the `pipeline-express` schema in the Table Editor to view your tables!

---

## 🎯 Features Now Available

### Workflow Management
- ✅ **Save workflows** to the cloud
- ✅ **Load workflows** from any device
- ✅ **Update existing workflows**
- ✅ **Delete workflows** you no longer need
- ✅ **Search workflows** by name
- ✅ **View workflow metadata** (nodes, connections, dates)

### Data Storage
- 📊 Workflows with nodes and edges
- 🏷️ Workflow names and descriptions
- 📅 Created and updated timestamps
- 🔒 Secure with Row Level Security (RLS)

### Saved Workflows Page
- 📋 Grid view of all saved workflows
- 🔍 Search functionality
- ✏️ Quick edit/open workflows
- 🗑️ Delete with confirmation
- 📊 View workflow stats

---

## 🔧 Troubleshooting

### "Workflows not saving to Supabase"

**Check:**
1. `.env` file exists and has correct credentials
2. No extra spaces in environment variable values
3. Server was restarted after creating `.env`
4. SQL schema was executed successfully in Supabase

**Test in console:**
```javascript
console.log(process.env.REACT_APP_SUPABASE_URL);
// Should print your Supabase URL, not undefined
```

### "Error accessing database"

**Check:**
1. Supabase project is active (not paused)
2. SQL schema was executed without errors
3. RLS policies are enabled (they should be from the schema)
4. The `pipeline-express` schema exists (run verification queries from SUPABASE_SCHEMA.md)
5. Permissions were granted to anon and authenticated roles

### "Workflows still saving to localStorage"

This is the fallback behavior when Supabase is not configured. It's working as designed! Check the environment variables to enable Supabase.

---

## 📊 Database Schema

All tables are created in the custom **`pipeline-express`** schema.

### `pipeline-express.workflows` Table
```
- id (UUID, Primary Key)
- name (Text) - Workflow name
- description (Text) - Optional description
- nodes (JSONB) - Array of workflow nodes
- edges (JSONB) - Array of connections
- created_at (Timestamp)
- updated_at (Timestamp)
- user_id (Text) - For future auth (nullable for anon users)
- is_public (Boolean) - Share workflows
- tags (Text[]) - Categorization
- thumbnail (Text) - Preview image URL
```

### Security
- Custom `pipeline-express` schema for organization
- Row Level Security (RLS) enabled on all tables
- Anonymous users can create and manage workflows (user_id can be NULL)
- Policies allow localStorage-like behavior without authentication
- Future-ready for adding authentication when needed

---

## 🎨 Customization Ideas

### Add Authentication
Supabase supports multiple auth providers:
- Email/Password
- Google, GitHub, etc.
- Magic Links

### Add Features
- Import/Export workflows as JSON
- Share public workflows
- Workflow templates library
- Version history
- Collaboration features

### Extend Schema
- Add `workflow_executions` table for history
- Add `comments` for team collaboration
- Add `workflow_templates` for sharing

---

## 🔌 Additional Integrations

### Azure DevOps Module Integration
Load custom system modules from YAML files in your Azure DevOps repository:

- **Dynamic module definitions** - Update modules without code changes
- **Centralized management** - Share modules across teams
- **Version control** - Track module changes in ADO
- **Secure authentication** - Uses Personal Access Token (PAT)

See **[ADO_MODULES_GUIDE.md](./ADO_MODULES_GUIDE.md)** for complete setup instructions.

Example environment variables:
```env
REACT_APP_ADO_ORG=your-organization
REACT_APP_ADO_PROJECT=your-project
REACT_APP_ADO_REPO=your-repo
REACT_APP_ADO_PAT=your-personal-access-token
REACT_APP_ADO_MODULES_PATH=modules
```

---

## 🆘 Need Help?

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **SQL Schema**: See `SUPABASE_SCHEMA.md` for full schema details
- **ADO Integration**: See `ADO_MODULES_GUIDE.md` for Azure DevOps setup
- **App Issues**: Check browser console for error messages

---

## 🎉 You're All Set!

Your Pipeline Express is now powered by Supabase with:
- ☁️ Cloud storage
- 🔄 Cross-device sync
- 🔒 Secure data storage
- 📈 Scalable architecture

Start building and saving your workflows! 🚀
