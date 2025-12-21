import React, { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import DashboardLayout from '../components/DashboardLayout';
import RecentWorkflows from '../components/dashboard/RecentWorkflows';
import WorkflowStatistics from '../components/dashboard/WorkflowStatistics';
import QuickActions from '../components/dashboard/QuickActions';
import ExecutionHistory from '../components/dashboard/ExecutionHistory';
import TracksAnimation from '../components/TracksAnimation';
import './Home.css';

const Home = () => {
  useLayoutEffect(() => {
    // Set initial state to visible in case animations don't run
    gsap.set('.dashboard-header, .dashboard-section', { clearProps: 'all' });

    // Animate dashboard header
    gsap.from('.dashboard-header', {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: 'power2.out'
    });

    // Stagger animate dashboard cards
    gsap.from('.dashboard-section', {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.15,
      delay: 0.2,
      ease: 'power2.out'
    });
  }, []);

  return (
    <DashboardLayout>
      <TracksAnimation />
      <div className="dashboard-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome to Pipeline Express</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section full-width">
            <WorkflowStatistics />
          </div>

          <div className="dashboard-section">
            <QuickActions />
          </div>

          <div className="dashboard-section">
            <RecentWorkflows />
          </div>

          <div className="dashboard-section full-width">
            <ExecutionHistory />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
