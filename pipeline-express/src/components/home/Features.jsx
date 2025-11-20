import React from 'react';
import { FEATURES_DATA } from '../../constants/featuresData';

const Features = () => (
  <section className="features" id="features">
    <h2>Features</h2>
    <div className="features-grid">
      {FEATURES_DATA.map((feature, index) => (
        <div key={index} className="feature-card">
          <h3>{feature.title}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Features;
