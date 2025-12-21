import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Layers, FileCode } from 'lucide-react';
import DashboardCard from './DashboardCard';
import './QuickActions.css';

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'New Workflow',
      description: 'Create a new workflow from scratch',
      onClick: () => navigate('/builder'),
      color: 'primary',
    },
    {
      icon: FolderOpen,
      label: 'Browse Workflows',
      description: 'View and manage saved workflows',
      onClick: () => navigate('/saved-workflows'),
      color: 'secondary',
    },
    {
      icon: Layers,
      label: 'Templates',
      description: 'Explore available templates',
      onClick: () => navigate('/templates'),
      color: 'accent',
    },
    {
      icon: FileCode,
      label: 'Open Builder',
      description: 'Jump straight to the builder',
      onClick: () => navigate('/builder'),
      color: 'tertiary',
    },
  ];

  return (
    <DashboardCard title="Quick Actions" icon={Plus}>
      <div className="quick-actions-grid">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              className={`quick-action-btn ${action.color}`}
              onClick={action.onClick}
            >
              <div className="quick-action-icon-wrapper">
                <Icon size={24} />
              </div>
              <div className="quick-action-content">
                <div className="quick-action-label">{action.label}</div>
                <div className="quick-action-description">{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </DashboardCard>
  );
}

export default QuickActions;
