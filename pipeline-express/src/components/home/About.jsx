import React from 'react';
import { STATS_DATA } from '../../constants/featuresData';

const About = () => (
  <section className="about" id="about">
    <div className="about-content">
      <h2>About Pipeline Express</h2>
      <p>
        Built by the MLOps and EDW teams to solve the pipeline deployment and standardization
        bottlenecks. We transform complex CI/CD workflows into simple, shareable templates that
        any team can use. Our mission is to eliminate the friction between development and
        deployment through proven automation patterns.
      </p>
      <div className="stats">
        {STATS_DATA.map((stat, index) => (
          <div key={index} className="stat">
            <span className="stat-number">{stat.number}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default About;
