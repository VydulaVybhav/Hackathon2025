# Keycloak Authentication Proxy Setup

This guide explains how to set up the authentication proxy to protect Supabase and n8n webhook endpoints with Keycloak authentication and CORS.

## Architecture

```
User → React App → Proxy Server → Keycloak (validate token)
                      ↓
                 Supabase / n8n
```

1. React app authenticates with Keycloak using service account credentials
2. Proxy validates JWT tokens using Keycloak's public keys
3. All Supabase and n8n requests go through the authenticated proxy
4. CORS is properly configured for cross-origin requests

## Prerequisites

- Keycloak server running and accessible
- Service account (NUID) configured in Keycloak
- Supabase instance
- n8n instance (optional)

## Installation

### 1. Install Dependencies

Dependencies are already included in `package.json`:
```bash
npm install
```

Key packages:
- `express` - Web server
- `cors` - CORS middleware
- `jsonwebtoken` - JWT verification
- `jwks-rsa` - Keycloak public key fetching

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Supabase Configuration
HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_URL=https://your-project.supabase.co
HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# n8n Webhook Configuration
HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Keycloak Configuration (for proxy server)
HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_URL=http://localhost:8080
HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_REALM=your-realm
HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_CLIENT_ID=pipeline-express
HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_CLIENT_SECRET=  # Optional, for confidential clients

# Proxy Server Configuration
HYPERPLANE_CUSTOM_SECRET_KEY_PROXY_PORT=3001
HYPERPLANE_CUSTOM_SECRET_KEY_PROXY_ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000

# Enable Proxy Mode
HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_USE_PROXY=true
HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_PROXY_URL=http://localhost:3001

# Service Account Credentials
HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SERVICE_ACCOUNT_NUID=your-service-nuid
HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SERVICE_ACCOUNT_PASSWORD=your-service-password
```

### 3. Keycloak Setup

#### Create a Client
1. Log into Keycloak Admin Console
2. Navigate to your realm
3. Create a new client:
   - Client ID: `pipeline-express`
   - Client Protocol: `openid-connect`
   - Access Type: `public` or `confidential`
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`

#### Create Service Account User
1. Go to Users → Add User
2. Set username (this will be your NUID)
3. Set password in Credentials tab
4. Assign appropriate roles

#### Enable Resource Owner Password Flow
1. In client settings, enable:
   - Direct Access Grants Enabled: ON
   - Standard Flow Enabled: ON

## Usage

### Start the Proxy Server

In terminal 1:
```bash
npm run proxy
```

You should see:
```
🔐 Keycloak Authentication Proxy Server
🌐 Running on http://localhost:3001
📋 CORS enabled for: http://localhost:3000
```

### Start the React App

In terminal 2:
```bash
npm start
```

The app will:
1. Initialize authentication service
2. Authenticate with Keycloak using service account
3. Store JWT token in memory
4. Use token for all Supabase/n8n requests

## How It Works

### Authentication Flow

1. **App Startup**:
   ```javascript
   // App.js automatically calls:
   await authService.initialize();
   ```

2. **Service Account Login**:
   - Proxy sends credentials to Keycloak
   - Keycloak returns JWT access token and refresh token
   - Token stored in memory (not localStorage)

3. **API Requests**:
   ```javascript
   // All Supabase calls automatically authenticated
   const { data, error } = await supabase
     .from('workflows')
     .select('*');
   ```

4. **Token Refresh**:
   - Token auto-refreshes when it expires (< 60 seconds remaining)
   - If refresh fails, re-authenticates with service account

### Proxy Endpoints

#### Health Check
```bash
GET http://localhost:3001/health
```

#### Get Token (internal use)
```bash
POST http://localhost:3001/auth/token
Content-Type: application/json

{
  "username": "service-account-nuid",
  "password": "service-account-password"
}
```

#### Refresh Token (internal use)
```bash
POST http://localhost:3001/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}
```

#### Supabase Proxy
```bash
GET http://localhost:3001/supabase/rest/v1/workflows
Authorization: Bearer <keycloak-jwt-token>
```

#### n8n Webhook Proxy
```bash
POST http://localhost:3001/webhook/your-webhook-path
Authorization: Bearer <keycloak-jwt-token>
Content-Type: application/json

{ "data": "your-data" }
```

## Disabling Proxy Mode

To use direct connections (no authentication):

1. Set in `.env`:
   ```
   REACT_APP_USE_PROXY=false
   ```

2. Ensure Supabase credentials are set:
   ```
   HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

## Troubleshooting

### Proxy won't start
- Check Keycloak configuration in `.env`
- Ensure Keycloak server is running
- Verify `KEYCLOAK_URL`, `KEYCLOAK_REALM`, and `KEYCLOAK_CLIENT_ID`

### Authentication fails
- Verify service account credentials
- Check that user exists in Keycloak
- Ensure Direct Access Grants is enabled on client
- Check Keycloak logs for errors

### CORS errors
- Add your React app URL to `PROXY_ALLOWED_ORIGINS`
- Check browser console for specific CORS errors
- Verify proxy is running on correct port

### Token expired errors
- Token refresh should be automatic
- Check console for refresh errors
- Verify refresh token is being stored

### Supabase requests fail
- Check proxy logs for request details
- Verify Supabase URL in `.env`
- Test direct Supabase connection first
- Check Supabase API logs

## Security Considerations

### Service Account Security
- Service account credentials are in environment variables
- Token is stored in memory, not localStorage
- All users share the same service account token
- **No user-level audit trail**

### Future Enhancements
For production, consider:
1. **User SSO tokens**: Use individual user tokens for audit trail
2. **Token rotation**: Implement regular token rotation
3. **Rate limiting**: Add rate limiting to proxy
4. **Logging**: Add comprehensive request logging
5. **Monitoring**: Monitor authentication failures

## Architecture Diagram

```
┌──────────────┐
│  React App   │
│              │
│ ┌──────────┐ │
│ │Auth      │ │  Service Account Login
│ │Service   ├─┼───────────────────────┐
│ └──────────┘ │                       │
│              │                       ▼
│ ┌──────────┐ │   API Requests   ┌────────────┐
│ │Supabase  ├─┼──────────────────►│   Proxy    │
│ │Client    │ │  (with JWT)      │  Server    │
│ └──────────┘ │                  │            │
└──────────────┘                  │ ┌────────┐ │
                                  │ │JWT     │ │
                                  │ │Verify  │ │
                                  │ └────┬───┘ │
                                  │      │     │
                                  │      ▼     │
                                  │ ┌────────┐ │
                                  │ │CORS    │ │
                                  │ │Handler │ │
                                  │ └────┬───┘ │
                                  └──────┼─────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
           ┌────────────────┐                        ┌───────────────┐
           │   Keycloak     │                        │  Supabase     │
           │                │                        │  /            │
           │ • Token Issue  │                        │  n8n          │
           │ • Token Verify │                        └───────────────┘
           └────────────────┘
```

## Files

- `proxy-server.js` - Express proxy server with Keycloak integration
- `src/services/authService.js` - Authentication service for React
- `src/config/supabase.js` - Supabase client with proxy support
- `.env.example` - Environment variable template

## Support

For issues or questions:
1. Check Keycloak server logs
2. Check proxy server console output
3. Check browser console for client-side errors
4. Review this documentation
