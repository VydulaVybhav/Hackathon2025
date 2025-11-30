/**
 * Authentication Service with Service Account
 * Handles Keycloak authentication using a service account (NUID)
 * for backend API calls to Supabase and n8n through the proxy
 */

const PROXY_URL = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_PROXY_URL || 'http://localhost:3001';
const USE_PROXY = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_USE_PROXY === 'true';
const SERVICE_ACCOUNT_NUID = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SERVICE_ACCOUNT_NUID;
const SERVICE_ACCOUNT_PASSWORD = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SERVICE_ACCOUNT_PASSWORD;

class AuthService {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isInitialized = false;
  }

  /**
   * Initialize service - authenticate with service account
   * Call this on app startup
   */
  async initialize() {
    if (!USE_PROXY) {
      console.log('Proxy mode disabled, skipping authentication');
      this.isInitialized = true;
      return;
    }

    if (!SERVICE_ACCOUNT_NUID || !SERVICE_ACCOUNT_PASSWORD) {
      console.error('Service account credentials not configured');
      throw new Error('Service account credentials not found in environment variables');
    }

    try {
      console.log('Authenticating with service account...');
      await this.authenticate();
      this.isInitialized = true;
      console.log('Authentication successful');
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      throw error;
    }
  }

  /**
   * Authenticate with Keycloak using service account
   */
  async authenticate() {
    try {
      const response = await fetch(`${PROXY_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: SERVICE_ACCOUNT_NUID,
          password: SERVICE_ACCOUNT_PASSWORD,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Authentication failed');
      }

      const data = await response.json();

      this.token = data.access_token;
      this.refreshToken = data.refresh_token;

      // Calculate token expiry
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      this.tokenExpiry = payload.exp * 1000; // Convert to milliseconds

      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    // Consider token expired if it expires in less than 60 seconds
    return Date.now() >= (this.tokenExpiry - 60000);
  }

  /**
   * Refresh the access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${PROXY_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        // If refresh fails, try to re-authenticate
        console.log('Token refresh failed, re-authenticating...');
        await this.authenticate();
        return;
      }

      const data = await response.json();
      this.token = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }

      // Update token expiry
      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      this.tokenExpiry = payload.exp * 1000;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Try to re-authenticate
      await this.authenticate();
    }
  }

  /**
   * Get current access token, refreshing if needed
   */
  async getToken() {
    if (!USE_PROXY) {
      return null;
    }

    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    return this.token;
  }

  /**
   * Make an authenticated API request
   */
  async authenticatedFetch(url, options = {}) {
    if (!USE_PROXY) {
      // Direct request without proxy
      return fetch(url, options);
    }

    if (!this.isInitialized) {
      throw new Error('Auth service not initialized. Call initialize() first.');
    }

    // Get valid token
    const token = await this.getToken();

    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    // Make request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, try refreshing token and retry once
    if (response.status === 401 || response.status === 403) {
      console.log('Received 401/403, refreshing token and retrying...');
      await this.refreshAccessToken();

      const newToken = this.token;
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }

    return response;
  }

  /**
   * Make authenticated Supabase request
   */
  async supabaseRequest(endpoint, options = {}) {
    if (!USE_PROXY) {
      // Direct Supabase call with anon key
      const url = `${process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_URL}/rest/v1${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_ANON_KEY}`,
        ...options.headers,
      };

      return fetch(url, { ...options, headers });
    }

    // Through proxy with Keycloak token
    const url = `${PROXY_URL}/supabase/rest/v1${endpoint}`;
    return this.authenticatedFetch(url, options);
  }

  /**
   * Make authenticated webhook request
   */
  async webhookRequest(webhookPath, data, options = {}) {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    };

    if (!USE_PROXY) {
      // Direct webhook call
      const url = `${process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_N8N_WEBHOOK_URL}/${webhookPath}`;
      return fetch(url, requestOptions);
    }

    // Through proxy with Keycloak token
    const url = `${PROXY_URL}/webhook/${webhookPath}`;
    return this.authenticatedFetch(url, requestOptions);
  }

  /**
   * Get Supabase URL (for Supabase client initialization)
   */
  getSupabaseUrl() {
    if (!USE_PROXY) {
      return process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_URL;
    }
    return `${PROXY_URL}/supabase`;
  }

  /**
   * Get Supabase key (for Supabase client initialization)
   * When using proxy, we still need a dummy key for the client
   */
  getSupabaseKey() {
    if (!USE_PROXY) {
      return process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_ANON_KEY;
    }
    // Return dummy key - actual auth is handled by proxy
    return 'dummy-key-for-proxy-mode';
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for testing
export default AuthService;
