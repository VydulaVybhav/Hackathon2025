import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Layers } from 'lucide-react';
import './Templates.css';

const Templates = () => {
  return (
    <DashboardLayout>
      <div className="templates-container">
        <div className="templates-header">
          <h1 className="templates-title">Templates</h1>
          <p className="templates-subtitle">Explore available workflow templates</p>
        </div>

        <div className="templates-content">
          <div className="templates-placeholder">
            <Layers size={64} className="placeholder-icon" />
            <h2>Templates Coming Soon</h2>
            <p>Browse and use pre-built workflow templates to get started quickly.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Templates;
