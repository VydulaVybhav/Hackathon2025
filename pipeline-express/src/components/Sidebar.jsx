import React, { useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { Home, Workflow, FileCode, Layers, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const { toggleTheme } = useTheme();

  useLayoutEffect(() => {
    // Clear any previous animations and ensure elements are visible
    gsap.set('.sidebar, .sidebar-logo, .sidebar-tagline, .sidebar-nav-item, .sidebar-footer', { clearProps: 'all' });

    // Animate sidebar entrance
    gsap.from('.sidebar', {
      x: -300,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    // Animate sidebar header
    gsap.from('.sidebar-logo', {
      opacity: 0,
      y: -10,
      duration: 0.5,
      delay: 0.4,
      ease: 'power2.out'
    });

    gsap.from('.sidebar-tagline', {
      opacity: 0,
      duration: 0.4,
      delay: 0.5,
      ease: 'power2.out'
    });

    // Stagger animate navigation items
    gsap.from('.sidebar-nav-item', {
      x: -50,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      delay: 0.5,
      ease: 'back.out(1.7)'
    });

    // Animate footer
    gsap.from('.sidebar-footer', {
      opacity: 0,
      y: 20,
      duration: 0.5,
      delay: 0.9,
      ease: 'power2.out'
    });

    // Subtle glow effect on logo (continuous)
    gsap.to('.sidebar-logo', {
      textShadow: '0 0 15px var(--shadow-color)',
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: 1
    });
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/saved-workflows', label: 'Workflows', icon: Workflow },
    { path: '/builder', label: 'Builder', icon: FileCode },
    { path: '/templates', label: 'Templates', icon: Layers },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Pipeline Express</h1>
        <p className="sidebar-tagline">MLOps x EDW</p>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="sidebar-theme-toggle" title="Toggle theme">
          <Palette size={20} />
          <span>Theme</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
