import React from 'react';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import CtaBanner from './CtaBanner';
import About from './About';
import Contact from './Contact';

export default function Home({ onStartTest }) {
  return (
    <main className="overflow-x-hidden w-full relative">
    
      <Hero onStartTest={onStartTest} />

      <About />
      <HowItWorks />
      <Contact />

  
      <CtaBanner onStartTest={onStartTest} />
    </main>
  );
}