import React, { useEffect, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Clock, GitBranch, Link as LinkIcon } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { useWorkflowStorage } from '../../hooks/useWorkflowStorage';
import './RecentWorkflows.css';

function RecentWorkflows() {
  const navigate = useNavigate();
  const { workflows, loading } = useWorkflowStorage();
  const [recentWorkflows, setRecentWorkflows] = useState([]);

  useEffect(() => {
    if (workflows && workflows.length > 0) {
      const sorted = [...workflows]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5);
      setRecentWorkflows(sorted);
    }
  }, [workflows]);

  // Animate workflow items when they load
  useLayoutEffect(() => {
    if (recentWorkflows.length > 0) {
      // Ensure elements are visible first
      gsap.set('.recent-workflow-item', { clearProps: 'all' });

      gsap.from('.recent-workflow-item', {
        x: -20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.2
      });
    }
  }, [recentWorkflows]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleWorkflowClick = (workflowId) => {
    navigate(`/builder/${workflowId}`);
  };

  if (loading) {
    return (
      <DashboardCard title="Recent Workflows" icon={Clock}>
        <div className="recent-workflows-loading">Loading workflows...</div>
      </DashboardCard>
    );
  }

  if (!recentWorkflows || recentWorkflows.length === 0) {
    return (
      <DashboardCard title="Recent Workflows" icon={Clock}>
        <div className="recent-workflows-empty">
          <p>No workflows yet</p>
          <button
            className="create-workflow-btn"
            onClick={() => navigate('/builder')}
          >
            Create Your First Workflow
          </button>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Recent Workflows" icon={Clock}>
      <div className="recent-workflows-list">
        {recentWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            className="recent-workflow-item"
            onClick={() => handleWorkflowClick(workflow.id)}
          >
            <div className="recent-workflow-info">
              <h4 className="recent-workflow-name">{workflow.name}</h4>
              <p className="recent-workflow-description">{workflow.description || 'No description'}</p>
            </div>
            <div className="recent-workflow-meta">
              <span className="recent-workflow-stat">
                <GitBranch size={14} />
                {workflow.nodes?.length || 0} nodes
              </span>
              <span className="recent-workflow-stat">
                <LinkIcon size={14} />
                {workflow.edges?.length || 0} connections
              </span>
              <span className="recent-workflow-time">{formatDate(workflow.updated_at)}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        className="view-all-btn"
        onClick={() => navigate('/saved-workflows')}
      >
        View All Workflows
      </button>
    </DashboardCard>
  );
}

export default RecentWorkflows;
