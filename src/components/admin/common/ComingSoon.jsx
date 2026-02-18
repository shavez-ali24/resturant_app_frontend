import React, { useState, useEffect } from 'react';

const ProfessionalComingSoon = () => {
  const [characterPosition, setCharacterPosition] = useState(-100);
  const [armWave, setArmWave] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [glow, setGlow] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [particles, setParticles] = useState([]);

  // Generate floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 4 + Math.random() * 8
    }));
    setParticles(newParticles);
  }, []);

  // Character entry animation from bottom
  useEffect(() => {
    // Character rises from bottom
    const riseTimer = setTimeout(() => {
      setCharacterPosition(0);
    }, 500);

    // Glow effect
    const glowTimer = setTimeout(() => {
      setGlow(true);
    }, 1500);

    // Show prompt
    const promptTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 2500);

    // Continuous arm wave animation
    const waveInterval = setInterval(() => {
      setArmWave(true);
      setTimeout(() => setArmWave(false), 1200);
    }, 3500);

    // Continuous bounce animation
    const bounceInterval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 800);
    }, 5000);

    return () => {
      clearTimeout(riseTimer);
      clearTimeout(glowTimer);
      clearTimeout(promptTimer);
      clearInterval(waveInterval);
      clearInterval(bounceInterval);
    };
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* Animated Background Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-orange-300 to-amber-400 opacity-60"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `float-particle ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Main Character Container */}
      <div 
        className="relative w-full max-w-5xl flex justify-center items-center"
        style={{
          transform: `translateY(${characterPosition}px)`,
          transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        
        {/* Character with Enhanced Design */}
        <div className={`relative transition-all duration-500 ${bounce ? 'transform -translate-y-6' : ''}`}>
          
          {/* Glow Effect */}
          <div className={`absolute inset-0 rounded-full blur-xl bg-orange-400 opacity-20 transition-all duration-1000 ${
            glow ? 'scale-150 opacity-40' : 'scale-100 opacity-0'
          }`}></div>
          
          {/* Character Body */}
          <div className="relative">
            
            {/* Enhanced Head with Better Shadows */}
            <div className="w-44 h-44 bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 z-20 border-4 border-orange-400 shadow-2xl">
              
              {/* Shine Effect */}
              <div className="absolute top-2 left-4 w-8 h-4 bg-white/30 rounded-full blur-sm"></div>
              
              {/* Enhanced Eyes */}
              <div className="flex justify-between px-12 pt-12">
                <div className="w-9 h-9 bg-black rounded-full animate-blink relative">
                  <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full opacity-80"></div>
                </div>
                <div className="w-9 h-9 bg-black rounded-full animate-blink relative" style={{animationDelay: '0.2s'}}>
                  <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full opacity-80"></div>
                </div>
              </div>
              
              {/* Animated Smile */}
              <div className="w-24 h-12 border-b-4 border-orange-800 rounded-b-full mx-auto mt-8 animate-smile"></div>
              
              {/* Enhanced Cheeks */}
              <div className="absolute -left-3 top-14 w-7 h-7 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full opacity-70 animate-ping"></div>
              <div className="absolute -right-3 top-14 w-7 h-7 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full opacity-70 animate-ping" style={{animationDelay: '0.5s'}}></div>
            </div>
            
            {/* Enhanced Body with Better Gradients */}
            <div className="w-56 h-64 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 rounded-3xl absolute top-32 left-1/2 transform -translate-x-1/2 border-4 border-orange-600 shadow-2xl relative overflow-hidden">
              
              {/* Body Shine */}
              <div className="absolute top-2 left-4 w-16 h-6 bg-orange-300/40 rounded-full blur-md"></div>
              
              {/* Tap N Order Text in Body Center */}
              <div className="absolute 
top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center ">
                <div className="text-white font-black text-2xl tracking-wider animate-pulse bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent ">
                  TAP N BITE
                </div>
              </div>
              
              {/* Enhanced Left Arm */}
              <div 
                className={`absolute -left-28 top-8 w-12 h-40 bg-gradient-to-b from-orange-300 via-orange-400 to-amber-500 rounded-full origin-top border-4 border-orange-500 shadow-2xl transition-all duration-700 ${
                  armWave ? 'animate-wave-left' : 'animate-idle-left'
                }`}
              >
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-orange-600 rounded-full"></div>
              </div>
              
              {/* Enhanced Right Arm */}
              <div 
                className={`absolute -right-28 top-8 w-12 h-40 bg-gradient-to-b from-orange-300 via-orange-400 to-amber-500 rounded-full origin-top border-4 border-orange-500 shadow-2xl transition-all duration-700 ${
                  armWave ? 'animate-wave-right' : 'animate-idle-right'
                }`}
              >
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-orange-600 rounded-full"></div>
              </div>
            </div>
            
            {/* Enhanced Legs */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-10">
              <div className="w-20 h-36 bg-gradient-to-b from-orange-500 via-orange-600 to-amber-700 rounded-full border-4 border-orange-700 shadow-2xl relative">
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-orange-800 rounded-full"></div>
              </div>
              <div className="w-20 h-36 bg-gradient-to-b from-orange-500 via-orange-600 to-amber-700 rounded-full border-4 border-orange-700 shadow-2xl relative">
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-orange-800 rounded-full"></div>
              </div>
            </div>
            
            {/* Professional Coming Soon Board */}
            <div 
              className={`absolute -top-48 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${
                characterPosition === 0 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              <div className="relative">
                {/* Board Glow */}
                <div className={`absolute inset-0 bg-orange-400 rounded-3xl blur-xl opacity-30 transition-all duration-1000 ${
                  glow ? 'scale-110 opacity-50' : 'scale-100 opacity-20'
                }`}></div>
                
                {/* Main Board */}
                <div className="w-[480px] h-64 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-100 border-6 border-orange-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 relative z-10">
                  
                  {/* Metallic Handles */}
                  <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 w-10 h-28 bg-gradient-to-b from-orange-600 via-amber-600 to-orange-800 rounded-full shadow-lg border-2 border-orange-700"></div>
                  <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 w-10 h-28 bg-gradient-to-b from-orange-600 via-amber-600 to-orange-800 rounded-full shadow-lg border-2 border-orange-700"></div>
                  
                  {/* Board Content */}
                  <div className="text-center relative z-20">
                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-orange-700 mb-6 tracking-tight animate-glow-text">
                      COMING SOON
                    </div>
                    <div className="w-full h-3 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full mt-2 shadow-lg"></div>
                  </div>
                  
                  {/* Corner Accents */}
                  <div className="absolute top-4 left-4 w-6 h-6 bg-orange-500 rounded-full opacity-60 animate-pulse"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 bg-orange-500 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.6s'}}></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 bg-orange-500 rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.9s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Prompt */}
      <div 
        className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-2000 ${
          showPrompt ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-orange-400 text-center">
          {/* <p className="text-xl font-bold animate-pulse">
            जल्द ही लेकर आ रहे हैं! 🚀
          </p> */}
          <p className="text-sm mt-1 opacity-90">
            We'll be back soon with something amazing!
          </p>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes wave-left {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(30deg) translateY(-15px) scale(1.05); }
          50% { transform: rotate(-20deg) translateY(8px) scale(0.95); }
          75% { transform: rotate(20deg) translateY(-8px) scale(1.02); }
        }
        
        @keyframes wave-right {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-30deg) translateY(-15px) scale(1.05); }
          50% { transform: rotate(20deg) translateY(8px) scale(0.95); }
          75% { transform: rotate(-20deg) translateY(-8px) scale(1.02); }
        }
        
        @keyframes idle-left {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50% { transform: rotate(8deg) scale(1.02); }
        }
        
        @keyframes idle-right {
          0%, 100% { transform: rotate(8deg) scale(1); }
          50% { transform: rotate(-8deg) scale(1.02); }
        }
        
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); opacity: 1; }
          95% { transform: scaleY(0.1); opacity: 0.7; }
        }
        
        @keyframes smile {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.1); }
        }
        
        @keyframes glow-text {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 165, 0, 0.5)); }
          50% { filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.8)); }
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          50% { transform: translateY(-100px) rotate(180deg) scale(1.2); opacity: 0.3; }
          90% { opacity: 0; }
        }

        .animate-wave-left {
          animation: wave-left 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-wave-right {
          animation: wave-right 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-idle-left {
          animation: idle-left 4s ease-in-out infinite;
        }
        
        .animate-idle-right {
          animation: idle-right 4s ease-in-out infinite;
        }
        
        .animate-blink {
          animation: blink 4s infinite;
        }
        
        .animate-smile {
          animation: smile 3s ease-in-out infinite;
        }
        
        .animate-glow-text {
          animation: glow-text 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalComingSoon;