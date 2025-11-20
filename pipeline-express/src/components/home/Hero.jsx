import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => (
  <section className="hero" id="home">
    <div className="hero-content">
      <h1>Pipeline Express</h1>
      <p>Powered by MLOps x EDW</p>
      <div className="hero-buttons">
        <Link to="/builder" className="cta-button">
          Start Building
        </Link>
        <a href="#features" className="cta-button secondary">
          Explore Features
        </a>
      </div>
    </div>
  </section>
);

export default Hero;
