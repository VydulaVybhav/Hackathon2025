import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../config/supabase';
import './SupabaseWarning.css';

const SupabaseWarning = () => {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div className="supabase-warning">
      <div className="supabase-warning-content">
        <AlertTriangle size={20} />
        <div className="supabase-warning-text">
          <strong>Supabase Not Configured</strong>
          <p>
            Workflows cannot be saved. Please add Supabase credentials to your .env file.
            See <code>SETUP_GUIDE.md</code> for instructions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseWarning;
