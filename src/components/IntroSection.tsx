import React from 'react';
import { cn } from "@/lib/utils";

interface IntroSectionProps {
  className?: string;
}

const IntroSection: React.FC<IntroSectionProps> = ({ className }) => {
  const handleDemoClick = () => {
    window.location.href = "#dialogues";
  };

  const handleLearnMoreClick = () => {
    window.location.href = "#features";
  };

  return (
    <section 
      className={cn("relative min-h-screen flex items-center section-padding", className)}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-50 to-transparent opacity-70" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-xs font-medium text-blue-700">Powered by Edge AI</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Accelerating <span className="text-blue-600">Bio-Manufacturing</span> with Edge AI
            </h1>
            
            <p className="text-lg text-neutral-600 max-w-xl">
              According to statistics, the global chemical industry consumes about 7% of fossil fuels annually, generating large amounts of greenhouse gases, and bio-manufacturing aims to replace traditional chemical processes with bio-synthesis processes catalyzed by enzymes, expected to yield 30-50% of reduction on waste emissions.
            </p>
            
            <p className="text-lg text-neutral-600 max-w-xl">
              Our mission is to accelerate such replacement by democratizing the adoption of generative AI models for discovering novel enzymes. Our core product provides both usability and data privacy guarantees by running 100% at the edge and is backboned by our proprietary algorithm patented at HKUST.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                className="px-6 py-3 bg-darkGreen-600 text-white rounded-full text-sm font-medium transition-all hover:bg-darkGreen-700 shadow-sm"
                onClick={handleDemoClick}
              >
                Try the Demo
              </button>
              <button 
                className="px-6 py-3 rounded-full text-sm font-medium border border-neutral-300 transition-all hover:bg-neutral-50"
                onClick={handleLearnMoreClick}
              >
                Learn More
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto">
              <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-darkGreen-500/20 rounded-full blur-3xl" />
              <div className="relative glass-card p-6 animate-fade-up">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Edge AI Enzyme Design</h3>
                    <div className="w-4 h-4 rounded-full bg-darkGreen-600 flex items-center justify-center">
                      <span className="text-white text-xs">i</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-darkGreen-600 rounded-full" />
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full w-3/5 bg-darkGreen-600 rounded-full" />
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full w-5/6 bg-darkGreen-600 rounded-full" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                    <div className="w-12 h-12 bg-darkGreen-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-darkGreen-600">
                        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">100% Edge Computing</h4>
                      <p className="text-xs text-neutral-600">Data privacy guaranteed</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-12 right-0 lg:-right-12 glass-card p-4 animate-fade-up delay-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-darkGreen-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-darkGreen-600">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                      <path d="M2 17l10 5 10-5"></path>
                      <path d="M2 12l10 5 10-5"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Nvidia GB10 Powered</h4>
                    <p className="text-xs text-neutral-600">Datacenter-level performance</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-60 left-0 lg:-left-12 glass-card p-4 animate-fade-up delay-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-darkGreen-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-darkGreen-600">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Test-Time Scaling</h4>
                    <p className="text-xs text-neutral-600">No costly fine-tuning required</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
