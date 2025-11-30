import { createClient } from '@supabase/supabase-js';
import { authService } from '../services/authService';

const USE_PROXY = process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_USE_PROXY === 'true';
const supabaseUrl = USE_PROXY
  ? authService.getSupabaseUrl()
  : process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = USE_PROXY
  ? authService.getSupabaseKey()
  : process.env.HYPERPLANE_CUSTOM_SECRET_KEY_REACT_APP_SUPABASE_ANON_KEY;

if (!USE_PROXY && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    'Supabase credentials not found. Please add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Create Supabase client with custom fetch for proxy mode
const customFetch = USE_PROXY
  ? async (url, options) => {
      return authService.authenticatedFetch(url, options);
    }
  : undefined;

export const supabase = (USE_PROXY || (supabaseUrl && supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'pipeline-express', // Use custom schema
      },
      global: {
        fetch: customFetch, // Custom fetch for REST API through proxy
      },
      realtime: {
        // Realtime WebSocket connections (go direct to Supabase, not through proxy)
        params: {
          eventsPerSecond: 10, // Throttle events to prevent overwhelming the client
        },
      },
    })
  : null;

export const isSupabaseConfigured = () => {
  return supabase !== null;
};
