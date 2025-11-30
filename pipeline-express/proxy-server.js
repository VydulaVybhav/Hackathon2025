/**
 * Authentication Proxy Server with Keycloak Integration
 *
 * This proxy sits between your React app and backend services, providing:
 * - Real Keycloak JWT authentication
 * - CORS handling
 * - Request proxying to Supabase and n8n
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const app = express();

// Configuration from environment variables
const PORT = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_PROXY_PORT || 3001;
const SUPABASE_URL = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_ANON_KEY;
const N8N_WEBHOOK_URL = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_N8N_WEBHOOK_URL;

// Keycloak Configuration
const KEYCLOAK_URL = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_URL; // e.g., http://localhost:8080
const KEYCLOAK_REALM = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_REALM; // e.g., myrealm
const KEYCLOAK_CLIENT_ID = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_CLIENT_ID; // e.g., my-app
const KEYCLOAK_CLIENT_SECRET = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_KEYCLOAK_CLIENT_SECRET; // Optional, for confidential clients

// Validate required configuration
if (!KEYCLOAK_URL || !KEYCLOAK_REALM || !KEYCLOAK_CLIENT_ID) {
  console.error('ERROR: Missing required Keycloak configuration!');
  console.error('Required environment variables:');
  console.error('  - KEYCLOAK_URL (e.g., http://localhost:8080)');
  console.error('  - KEYCLOAK_REALM (e.g., myrealm)');
  console.error('  - KEYCLOAK_CLIENT_ID (e.g., my-app)');
  process.exit(1);
}

// Construct Keycloak URLs
const KEYCLOAK_REALM_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;
const KEYCLOAK_TOKEN_URL = `${KEYCLOAK_REALM_URL}/protocol/openid-connect/token`;
const KEYCLOAK_CERTS_URL = `${KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`;

// JWKS client for verifying Keycloak tokens
const jwksClientInstance = jwksClient({
  jwksUri: KEYCLOAK_CERTS_URL,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// CORS configuration
const corsOptions = {
  origin: process.env.HYPERPLANE_CUSTOM_SECRET_KEY_PROXY_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'apikey',
    'x-client-info'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Get signing key from Keycloak JWKS
 */
function getKey(header, callback) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * JWT Authentication Middleware
 * Validates Keycloak-issued Bearer token
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'No Authorization header provided'
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Invalid Authorization header format'
    });
  }

  // Verify token using Keycloak's public key
  jwt.verify(token, getKey, {
    audience: KEYCLOAK_CLIENT_ID,
    issuer: KEYCLOAK_REALM_URL,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({
        error: 'invalid_token',
        error_description: err.message
      });
    }

    // Token is valid, attach user info to request
    req.user = decoded;
    req.token = token;
    next();
  });
};

/**
 * Health check endpoint (no auth required)
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Keycloak Authentication Proxy',
    keycloak: {
      url: KEYCLOAK_URL,
      realm: KEYCLOAK_REALM,
      client_id: KEYCLOAK_CLIENT_ID
    }
  });
});

/**
 * Keycloak Token Endpoint
 * Authenticates user with Keycloak and returns access token
 */
app.post('/auth/token', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Username and password are required'
    });
  }

  try {
    // Request token from Keycloak using Resource Owner Password Credentials flow
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', KEYCLOAK_CLIENT_ID);
    params.append('username', username);
    params.append('password', password);

    // Add client_secret if configured (for confidential clients)
    if (KEYCLOAK_CLIENT_SECRET) {
      params.append('client_secret', KEYCLOAK_CLIENT_SECRET);
    }

    const response = await fetch(KEYCLOAK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Keycloak authentication failed:', data);
      return res.status(response.status).json(data);
    }

    // Return the token response from Keycloak
    res.json(data);
  } catch (error) {
    console.error('Error authenticating with Keycloak:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Failed to authenticate with Keycloak'
    });
  }
});

/**
 * Token refresh endpoint
 */
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Refresh token is required'
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', KEYCLOAK_CLIENT_ID);
    params.append('refresh_token', refresh_token);

    if (KEYCLOAK_CLIENT_SECRET) {
      params.append('client_secret', KEYCLOAK_CLIENT_SECRET);
    }

    const response = await fetch(KEYCLOAK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Failed to refresh token'
    });
  }
});

/**
 * User info endpoint
 */
app.get('/auth/userinfo', authenticateJWT, (req, res) => {
  res.json({
    sub: req.user.sub,
    preferred_username: req.user.preferred_username,
    email: req.user.email,
    name: req.user.name,
    given_name: req.user.given_name,
    family_name: req.user.family_name,
    roles: req.user.realm_access?.roles || []
  });
});

/**
 * Supabase Proxy Routes
 * All Supabase requests go through Keycloak authentication
 */
app.all('/supabase/*', authenticateJWT, async (req, res) => {
  if (!SUPABASE_URL) {
    return res.status(500).json({
      error: 'Configuration error',
      message: 'SUPABASE_URL not configured'
    });
  }

  try {
    // Extract path after /supabase/
    const supabasePath = req.path.replace('/supabase/', '');
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `${SUPABASE_URL}/${supabasePath}${queryString}`;

    console.log(`Proxying to Supabase: ${targetUrl}`);

    // Prepare headers for Supabase
    const supabaseHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };

    // Copy relevant headers from original request
    if (req.headers['prefer']) {
      supabaseHeaders['Prefer'] = req.headers['prefer'];
    }
    if (req.headers['x-client-info']) {
      supabaseHeaders['x-client-info'] = req.headers['x-client-info'];
    }

    // Forward the request to Supabase
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: supabaseHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    // Copy response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send response
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Supabase proxy error:', error);
    res.status(500).json({
      error: 'proxy_error',
      message: error.message
    });
  }
});

/**
 * n8n Webhook Proxy Routes
 * All webhook requests require Keycloak authentication
 */
app.all('/webhook/*', authenticateJWT, async (req, res) => {
  if (!N8N_WEBHOOK_URL) {
    return res.status(500).json({
      error: 'Configuration error',
      message: 'N8N_WEBHOOK_URL not configured'
    });
  }

  try {
    // Extract webhook path
    const webhookPath = req.path.replace('/webhook/', '');
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = `${N8N_WEBHOOK_URL}/${webhookPath}${queryString}`;

    console.log(`Proxying to n8n webhook: ${targetUrl}`);

    // Forward the request to n8n
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Add user context from Keycloak token
        'X-User-ID': req.user.sub,
        'X-User-Email': req.user.email || '',
        'X-Username': req.user.preferred_username || ''
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    // Copy response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send response
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('n8n webhook proxy error:', error);
    res.status(500).json({
      error: 'proxy_error',
      message: error.message
    });
  }
});

/**
 * Catch-all for undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    error_description: 'The requested endpoint does not exist'
  });
});

/**
 * Start server
 */
http.createServer(app).listen(PORT, () => {
  console.log(`\n🔐 Keycloak Authentication Proxy Server`);
  console.log(`🌐 Running on http://localhost:${PORT}`);
  console.log(`📋 CORS enabled for: ${corsOptions.origin.join(', ')}`);
  console.log(`\n🔑 Keycloak Configuration:`);
  console.log(`   URL: ${KEYCLOAK_URL}`);
  console.log(`   Realm: ${KEYCLOAK_REALM}`);
  console.log(`   Client ID: ${KEYCLOAK_CLIENT_ID}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /auth/token - Login with username/password`);
  console.log(`   POST /auth/refresh - Refresh access token`);
  console.log(`   GET  /auth/userinfo - Get user information`);
  console.log(`   *    /supabase/* - Supabase proxy (requires auth)`);
  console.log(`   *    /webhook/* - n8n webhook proxy (requires auth)\n`);
});
