import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import About from '../components/home/About';

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
