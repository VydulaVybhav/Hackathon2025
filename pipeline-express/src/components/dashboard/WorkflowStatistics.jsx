import React, { useEffect, useState, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { BarChart3, Workflow, CheckCircle, Clock } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { useWorkflowStorage } from '../../hooks/useWorkflowStorage';
import './WorkflowStatistics.css';

function WorkflowStatistics() {
  const { workflows, loading } = useWorkflowStorage();
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    totalNodes: 0,
    totalConnections: 0,
    avgNodesPerWorkflow: 0,
  });

  const containerRef = useRef(null);

  useEffect(() => {
    if (workflows && workflows.length > 0) {
      const totalNodes = workflows.reduce((sum, w) => sum + (w.nodes?.length || 0), 0);
      const totalConnections = workflows.reduce((sum, w) => sum + (w.edges?.length || 0), 0);
      const avgNodes = workflows.length > 0 ? Math.round(totalNodes / workflows.length) : 0;

      setStats({
        totalWorkflows: workflows.length,
        totalNodes,
        totalConnections,
        avgNodesPerWorkflow: avgNodes,
      });
    } else {
      setStats({
        totalWorkflows: 0,
        totalNodes: 0,
        totalConnections: 0,
        avgNodesPerWorkflow: 0,
      });
    }
  }, [workflows]);

  // Helper for dash offset
  const setDashoffset = (el) => {
    const pathLength = el.getTotalLength();
    el.setAttribute('stroke-dasharray', pathLength);
    return pathLength;
  };

  // Anime.js animations
  useEffect(() => {
    if (!loading && containerRef.current) {
      // Animate cards staggering in
      animate('.stat-item', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(100),
        easing: 'spring(1, 80, 10, 0)'
      });

      // Animate numbers
      const statValues = document.querySelectorAll('.stat-value');
      statValues.forEach((el) => {
        const targetValue = parseInt(el.getAttribute('data-value') || '0', 10);
        animate(el, {
          innerHTML: [0, targetValue],
          round: 1,
          easing: 'easeInOutExpo',
          duration: 2000
        });
      });

      // Animate sparklines drawing
      const paths = document.querySelectorAll('.stat-sparkline path');
      paths.forEach(path => {
        const offset = setDashoffset(path);
        animate(path, {
          strokeDashoffset: [offset, 0],
          easing: 'easeInOutSine',
          duration: 1500,
          delay: stagger(200),
          direction: 'alternate',
          loop: false
        });
      });
    }
  }, [stats, loading]);

  if (loading) {
    return (
      <DashboardCard title="Statistics" icon={BarChart3}>
        <div className="stats-loading">Loading statistics...</div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Statistics" icon={BarChart3}>
      <div className="statistics-grid" ref={containerRef}>
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <Workflow size={24} className="stat-icon" />
          </div>
          <div className="stat-info">
            <div className="stat-value" data-value={stats.totalWorkflows}>0</div>
            <div className="stat-label">Total Workflows</div>
            <svg className="stat-sparkline" width="100" height="20" viewBox="0 0 100 20">
              <path d="M0,15 Q20,5 40,15 T80,10 T100,5" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeOpacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <CheckCircle size={24} className="stat-icon" />
          </div>
          <div className="stat-info">
            <div className="stat-value" data-value={stats.totalNodes}>0</div>
            <div className="stat-label">Total Nodes</div>
            <svg className="stat-sparkline" width="100" height="20" viewBox="0 0 100 20">
              <path d="M0,10 Q25,18 50,10 T100,12" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeOpacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <Clock size={24} className="stat-icon" />
          </div>
          <div className="stat-info">
            <div className="stat-value" data-value={stats.totalConnections}>0</div>
            <div className="stat-label">Total Connections</div>
            <svg className="stat-sparkline" width="100" height="20" viewBox="0 0 100 20">
              <path d="M0,18 Q30,5 60,15 T100,8" fill="none" stroke="#39ff14" strokeWidth="2" strokeOpacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <BarChart3 size={24} className="stat-icon" />
          </div>
          <div className="stat-info">
            <div className="stat-value" data-value={stats.avgNodesPerWorkflow}>0</div>
            <div className="stat-label">Avg Nodes/Workflow</div>
            <svg className="stat-sparkline" width="100" height="20" viewBox="0 0 100 20">
              <path d="M0,12 Q40,18 70,8 T100,15" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeOpacity="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export default WorkflowStatistics;
