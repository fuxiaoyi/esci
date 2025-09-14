import { Analytics } from "@vercel/analytics/react";
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const MarketingLanding = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Smooth scroll to element when URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    handleHashChange(); // Handle on initial load
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header isMounted={isMounted} />
      
      <main>
        <Analytics />
        
        <IntroSection isMounted={isMounted} />
        
        <FeaturesSection />
        
        <DialogueSection isMounted={isMounted} />
        
        <AboutSection />
      </main>
      
      <Footer />
    </div>
  );
};

const Header = ({ isMounted }: { isMounted: boolean }) => {
  const router = useRouter();

  const handleSignIn = () => {
    if (isMounted) {
      void router.push('/SignIn');
    }
  };

  const handleGetStarted = () => {
    if (isMounted) {
      void router.push('/SignIn');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-darkGreen-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-medium tracking-tight relative inline-flex items-center">
              Edge Science
              <span className="text-darkGreen-600">.</span>
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">Features</a>
            <a href="#about" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">About</a>
            <a href="#dialogues" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">Demo</a>
          </nav>
          
          <div className="flex space-x-4">
            <button 
              onClick={handleSignIn}
              className="text-neutral-600 hover:text-darkGreen-600 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={handleGetStarted}
              className="bg-darkGreen-600 text-white px-4 py-2 rounded-lg hover:bg-darkGreen-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const IntroSection = ({ isMounted }: { isMounted: boolean }) => {
  const router = useRouter();

  const handleStartDesigning = () => {
    if (isMounted) {
      void router.push('/signin');
    }
  };

  const handleWatchDemo = () => {
    if (isMounted) {
      void router.push('/signin');
    }
  };

  return (
    <section className="section-padding bg-gradient-to-br from-darkGreen-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-neutral-900">
            Revolutionary
            <span className="text-darkGreen-600"> Enzyme Design</span>
            <br />
            at the Edge
          </h1>
          <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
            Experience the future of bio-manufacturing with our cutting-edge edge AI solution. 
            Design novel enzymes with complete data privacy and datacenter-level performance 
            in a compact, edge-deployable system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleStartDesigning}
              className="bg-darkGreen-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-darkGreen-700 transition-colors"
            >
              Start Designing
            </button>
            <button 
              onClick={handleWatchDemo}
              className="border border-darkGreen-600 text-darkGreen-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-darkGreen-50 transition-colors"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="section-padding bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Product Overview</h2>
          <p className="text-neutral-600 max-w-4xl mx-auto">
            An integrated hardware and software solution of generative AI models for enzyme design. It is made possible with the latest Nvidia GB10 chips which provides computation power comparable to the last generation&apos;s datacenter. We optimize the model inference by CUDA programming to leverage a new AI methodology named &apos;test-time scaling&apos; which could avoid the costly fine-tuning or training which is required by existing alternative solution.
          </p>
        </div>
        
        <div className="text-center mb-16">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Key Advantages</h3>
          <p className="text-neutral-600 max-w-4xl mx-auto mb-8">
            Our product has shown advantages in five fine-grained aspects over existing solutions, including:
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            }
            title="Edge Installation"
            description="100% edge computing ensures data privacy and eliminates cloud dependency for sensitive enzyme design workflows."
          />
          
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            }
            title="Conversational UI"
            description="Intuitive conversational interface that makes complex enzyme design accessible to researchers and scientists."
          />
          
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            }
            title="Multi-property Optimization"
            description="Advanced algorithms that optimize multiple enzyme properties simultaneously for better design outcomes."
          />
          
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11H1l8-8v8z"></path>
                <path d="M23 13h-8v8l8-8z"></path>
              </svg>
            }
            title="CUDA Level Optimization"
            description="Deep CUDA programming optimizations leveraging Nvidia GB10 chips for maximum computational efficiency."
          />
          
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            }
            title="Training-free Experiment Guided Steering"
            description="Innovative test-time scaling methodology eliminates costly fine-tuning while maintaining high performance."
          />
          
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            }
            title="Unique Edge Solution"
            description="Notably, we are the only solution optimized at edge with a conversational user interface, to the best of our knowledge as of today."
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="glass-card p-6 transition-all hover:shadow-md hover:translate-y-[-4px] duration-300">
      <div className="w-12 h-12 bg-darkGreen-100 rounded-lg flex items-center justify-center mb-4 text-darkGreen-600">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
};

const DialogueSection = ({ isMounted }: { isMounted: boolean }) => {
  const router = useRouter();

  const handleSignInToDemo = () => {
    if (isMounted) {
      void router.push('/signin');
    }
  };

  return (
    <section id="dialogues" className="section-padding">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Interactive Enzyme Design</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Experience cutting-edge enzyme design through conversational AI, powered by our proprietary edge computing solution
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-neutral-200">
            <div className="text-center">
              <h3 className="text-xl font-medium mb-4">Sign in to access the interactive demo</h3>
              <p className="text-neutral-600 mb-6">
                Our conversational AI interface allows you to design enzymes through natural language interaction.
              </p>
              <button 
                onClick={handleSignInToDemo}
                className="bg-darkGreen-600 text-white px-6 py-3 rounded-lg hover:bg-darkGreen-700 transition-colors"
              >
                Sign In to Try Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section id="about" className="section-padding bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About Edge Science</h2>
            <p className="text-neutral-600 mb-6">
              Edge Science is a pioneering company focused on accelerating bio-manufacturing through innovative edge AI solutions. 
              We address the critical challenge of reducing greenhouse gas emissions in the chemical industry.
            </p>
            <p className="text-neutral-600 mb-6">
              Our proprietary algorithm, patented at HKUST, enables generative AI models to discover novel enzymes 
              while maintaining complete data privacy through 100% edge computing.
            </p>
            <p className="text-neutral-600 mb-6">
              By leveraging the latest Nvidia GB10 chips and our test-time scaling methodology, we provide 
              datacenter-level performance in a compact, edge-deployable solution.
            </p>
            
            <div className="space-y-4 mt-8">
              <StatItem label="Core Technology" value="Edge AI Computing" />
              <StatItem label="Optimization Method" value="Test-Time Scaling" />
              <StatItem label="Hardware Platform" value="Nvidia GB10" />
              <StatItem label="Patent Status" value="HKUST Patented" />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-darkGreen-500/10 rounded-full blur-3xl" />
            <div className="glass-card p-8 relative">
              <div className="flex justify-end mb-6">
                <div className="flex -space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              
              <div className="font-mono text-sm text-neutral-800 space-y-2">
                <div className="flex">
                  <span className="text-darkGreen-600 mr-2">$</span>
                  <span>edge_science enzyme_design.py</span>
                </div>
                <div className="text-neutral-600">Loading Edge AI Model...</div>
                <div className="text-neutral-600">Initializing CUDA optimization...</div>
                <div className="text-neutral-600">Starting enzyme design process...</div>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-darkGreen-600 rounded-full"></div>
                  </div>
                  <span className="ml-2 text-xs">75%</span>
                </div>
                <div className="text-neutral-600">Property Optimization - Score: 0.92</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex justify-between items-center py-2 border-b border-neutral-200">
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white py-12 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-darkGreen-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-medium tracking-tight relative inline-flex items-center">
                Edge Science
                <span className="text-darkGreen-600">.</span>
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <a href="#features" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">Features</a>
            <a href="#about" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">About</a>
            <a href="#dialogues" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">Demo</a>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-neutral-600 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Edge Science. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <a href="#" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <a href="#" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="text-neutral-600 hover:text-darkGreen-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingLanding;
