# Azure DevOps Module Integration Guide

This guide explains how to configure the application to load System Modules from Azure DevOps.

## Overview

**⚠️ REQUIRED: The application requires ADO configuration to load modules. There are no default fallback modules.**

The application fetches module definitions from YAML files stored in an Azure DevOps repository. This allows you to:
- Centrally manage module definitions
- Update modules without code changes
- Share modules across teams
- Version control your module configurations

## Prerequisites

1. An Azure DevOps organization and project
2. A repository containing module definition YAML files
3. A Personal Access Token (PAT) with **Code (Read)** permission

## Setup Instructions

### 1. Generate a Personal Access Token (PAT)

1. Go to `https://dev.azure.com/{your-org}/_usersSettings/tokens`
2. Click **New Token**
3. Configure the token:
   - **Name**: Pipeline Express Module Access
   - **Organization**: Select your organization
   - **Expiration**: Choose appropriate duration
   - **Scopes**: Select **Custom defined**
   - Under **Code**, check **Read**
4. Click **Create**
5. **Copy the token immediately** - you won't be able to see it again

### 2. Configure Environment Variables

Create a `.env` file in the `pipeline-express` directory (or copy from `.env.example`):

```bash
# Azure DevOps Configuration
REACT_APP_ADO_ORG=your-organization-name
REACT_APP_ADO_PROJECT=your-project-name
REACT_APP_ADO_REPO=your-repository-name
REACT_APP_ADO_PAT=your-personal-access-token
REACT_APP_ADO_MODULES_PATH=modules
REACT_APP_ADO_BRANCH=main
```

**Important**: Never commit your `.env` file with the actual PAT to version control!

### 3. Create Module YAML Files in ADO

In your Azure DevOps repository, create a folder (e.g., `modules/`) and add YAML files for each module.

#### YAML File Structure

Each module YAML file should have the following structure:

```yaml
# Module metadata
type: action  # 'trigger' or 'action'
label: Custom API Call
description: Make HTTP request to external API
icon: zap  # Icon name from lucide-react

# Parameters that users can configure
parameters:
  - name: url
    type: string
    default: https://api.example.com
    description: API endpoint URL

  - name: method
    type: string
    default: GET
    description: HTTP method

  - name: headers
    type: object
    default: '{"Content-Type": "application/json"}'
    description: Request headers

  - name: timeout
    type: number
    default: 30
    description: Request timeout in seconds
```

#### Example Module Files

**modules/slack-notification.yaml**
```yaml
type: action
label: Slack Notify
description: Send message to Slack channel
icon: message

parameters:
  - name: webhook_url
    type: string
    default: ""
    description: Slack webhook URL

  - name: channel
    type: string
    default: "#general"
    description: Target channel

  - name: message
    type: string
    default: "Workflow completed"
    description: Message content
```

**modules/database-query.yaml**
```yaml
type: action
label: SQL Query
description: Execute database query
icon: database

parameters:
  - name: connection_string
    type: string
    default: ""
    description: Database connection string

  - name: query
    type: string
    default: "SELECT * FROM users"
    description: SQL query to execute

  - name: timeout
    type: number
    default: 30
    description: Query timeout in seconds
```

### 4. Supported Icon Names

The application uses [Lucide React](https://lucide.dev/) icons. Common icon names include:

- `webhook`, `database`, `mail`, `calendar`, `code`
- `filter`, `message`, `clock`, `settings`, `cloud`
- `server`, `zap`, `file`, `folder`, `package`
- `upload`, `download`, `alert`, `check`, `info`

You can use any icon name from Lucide React. If an icon isn't found, it defaults to a box icon.

## How It Works

1. **On App Startup**: The `useModuleLoader` hook runs when the WorkflowBuilder component loads
2. **Configuration Check**: Checks if all required ADO environment variables are set
3. **Fetch Module Files**: Calls Azure DevOps REST API to list YAML files in the configured folder
4. **Parse Modules**: Downloads and parses each YAML file into module definitions
5. **Icon Mapping**: Maps icon name strings to actual React components
6. **Error Display**: If ADO is not configured or fetch fails, displays prominent error message with no modules available

## Troubleshooting

### Modules Not Loading

1. **Check Console**: Open browser DevTools and check for error messages
2. **Verify Environment Variables**: Ensure all `REACT_APP_ADO_*` variables are set correctly
3. **Test PAT**: Verify your PAT has the correct permissions and hasn't expired
4. **Check Network**: Look for failed API calls in the Network tab
5. **Verify File Path**: Ensure the `REACT_APP_ADO_MODULES_PATH` matches your folder structure

### "ADO not configured" Error

**This error means the app cannot function without ADO configuration.**

Check that you have set all required environment variables:
- `REACT_APP_ADO_ORG` - Your organization name
- `REACT_APP_ADO_PROJECT` - Your project name
- `REACT_APP_ADO_REPO` - Your repository name
- `REACT_APP_ADO_PAT` - Your Personal Access Token

The error message will tell you which specific variables are missing.

### YAML Parsing Errors

If a module fails to parse:
1. Check the YAML syntax is valid
2. Ensure `type` and `label` fields are present (required)
3. Verify the `parameters` array structure is correct

### Icon Not Displaying

If an icon shows as a box:
1. Check the icon name against [Lucide React icons](https://lucide.dev/icons)
2. Use lowercase names (e.g., `message` instead of `Message`)
3. Common names work best (`webhook`, `database`, `mail`, etc.)

## Security Best Practices

1. **Never commit PATs**: Add `.env` to `.gitignore`
2. **Use minimal permissions**: Only grant **Code (Read)** scope
3. **Rotate tokens regularly**: Set appropriate expiration dates
4. **Use organization tokens**: For shared deployments, use organization-level tokens
5. **Monitor access**: Review token usage in Azure DevOps

## Development vs Production

### Development
- Use `.env` file with your personal PAT
- Store module YAML files in a dev branch

### Production
- Use environment variables in your deployment platform
- Consider using Azure Key Vault for PAT storage
- Point to a stable branch (e.g., `main` or `release`)

## API Reference

### Azure DevOps REST API Endpoints Used

1. **List Files**: `GET /_apis/git/repositories/{repo}/items`
   - Lists files in the specified path
   - Filters for `.yaml` and `.yml` files

2. **Get File Content**: `GET /_apis/git/repositories/{repo}/items?path={filePath}`
   - Retrieves the content of a specific file

Both endpoints use Basic authentication with the PAT.

## Need Help?

- Check [Azure DevOps REST API docs](https://learn.microsoft.com/en-us/rest/api/azure/devops/)
- Review the browser console for detailed error messages
- The app will always fall back to default modules if ADO fetch fails
