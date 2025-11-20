import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Hero = () => (
    <section className="hero" id="home">
        <div className="hero-content">
            <h1>Pipeline Express</h1>
            <p>Powered by MLOps x EDW</p>
            <div className="hero-buttons">
                <Link to="/builder" className="cta-button">Start Building</Link>
                <a href="#features" className="cta-button secondary">Explore Features</a>
            </div>
        </div>
    </section>
);

const Features = () => (
    <section className="features" id="features">
        <h2>Features</h2>
        <div className="features-grid">
            <div className="feature-card">
                <h3>Template Hub</h3>
                <p>Access proven templates from DevOps, MLOps, and other teams.</p>
            </div>
            <div className="feature-card">
                <h3>Pipeline Builder</h3>
                <p>Build robust pipelines with guided step-by-step automation.</p>
            </div>
            <div className="feature-card">
                <h3>Pipeline Publisher</h3>
                <p>Deploy to AzureDevOps in seconds.</p>
            </div>
        </div>
    </section>
);

const About = () => (
    <section className="about" id="about">
        <div className="about-content">
            <h2>About Pipeline Express</h2>
            <p>Built by the MLOps and EDW teams to solve the pipeline deployment and standardization bottlenecks. We transform complex CI/CD workflows into simple, shareable templates that any team can use. Our mission is to eliminate the friction between development and deployment through proven automation patterns.</p>
            <div className="stats">
                <div className="stat">
                    <span className="stat-number">5</span>
                    <span className="stat-label">Robust Templates Available</span>
                </div>
                <div className="stat">
                    <span className="stat-number">10x</span>
                    <span className="stat-label">Faster Deployments</span>
                </div>
                <div className="stat">
                    <span className="stat-number">Zero</span>
                    <span className="stat-label">Config Complexity</span>
                </div>
            </div>
        </div>
    </section>
);

const Home = () => {
    return (
        <main>
            <Navbar />
            <Hero />
            <Features />
            <About />
        </main>
    );
};

export default Home;
