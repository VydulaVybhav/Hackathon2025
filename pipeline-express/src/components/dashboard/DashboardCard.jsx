import React, { useRef } from 'react';
import './DashboardCard.css';

function DashboardCard({ title, icon: Icon, children, className = '' }) {
  const cardRef = useRef(null);
  const rafId = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    // Cancel any pending frame to avoid stacking
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Use requestAnimationFrame for smooth performance
    rafId.current = requestAnimationFrame(() => {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -3; // Reduced rotation
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
      card.style.transition = 'none'; // Instant update
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  };

  const handleMouseLeave = () => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      cardRef.current.style.transition = 'transform 0.5s ease'; // Smooth reset
    }
  };

  return (
    <div
      className={`dashboard-card ${className}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-glare"></div>
      <div className="dashboard-card-float">
        <div className="dashboard-card-header">
          {Icon && <Icon size={20} className="dashboard-card-icon" />}
          <h3 className="dashboard-card-title">{title}</h3>
        </div>
        <div className="dashboard-card-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;
