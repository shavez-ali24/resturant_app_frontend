import { useState, useEffect } from 'react';

const comingSoonStyles = `
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
  .animate-wave-left  { animation: wave-left  1.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .animate-wave-right { animation: wave-right 1.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .animate-idle-left  { animation: idle-left  4s ease-in-out infinite; }
  .animate-idle-right { animation: idle-right 4s ease-in-out infinite; }
  .animate-blink      { animation: blink      4s infinite; }
  .animate-smile      { animation: smile      3s ease-in-out infinite; }
  .animate-glow-text  { animation: glow-text  2s ease-in-out infinite; }
`;

const ProfessionalComingSoon = () => {
  const [characterPosition, setCharacterPosition] = useState(-100);
  const [armWave, setArmWave]     = useState(false);
  const [bounce, setBounce]       = useState(false);
  const [glow, setGlow]           = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [particles, setParticles] = useState([]);

  const isDark = localStorage.getItem('admin-theme') === 'dark';

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 4 + Math.random() * 8,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const riseTimer   = setTimeout(() => setCharacterPosition(0), 500);
    const glowTimer   = setTimeout(() => setGlow(true), 1500);
    const promptTimer = setTimeout(() => setShowPrompt(true), 2500);

    const waveInterval = setInterval(() => {
      setArmWave(true);
      setTimeout(() => setArmWave(false), 1200);
    }, 3500);

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
    <>
      <style>{comingSoonStyles}</style>

      <div className={`relative flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center overflow-hidden p-3 sm:p-4 ${
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100'
      }`}>

        {/* Animated Background Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`absolute rounded-full opacity-60 ${isDark ? 'bg-gradient-to-r from-orange-600 to-amber-500' : 'bg-gradient-to-r from-orange-300 to-amber-400'}`}
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float-particle ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}

        {/* Main Character Container */}
        <div
          className="relative flex w-full max-w-6xl items-center justify-center"
          style={{
            transform: `translateY(${characterPosition}px)`,
            transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            className={`relative origin-center scale-[0.48] transition-all duration-500 sm:scale-[0.62] md:scale-[0.78] lg:scale-[0.9] xl:scale-100 ${
              bounce ? 'transform -translate-y-6' : ''
            }`}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-full blur-xl bg-orange-400 opacity-20 transition-all duration-1000 ${
              glow ? 'scale-150 opacity-40' : 'scale-100 opacity-0'
            }`} />

            {/* Character Body */}
            <div className="relative">

              {/* Head */}
              <div className="w-44 h-44 bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 z-20 border-4 border-orange-400 shadow-2xl">
                <div className="absolute top-2 left-4 w-8 h-4 bg-white/30 rounded-full blur-sm" />
                <div className="flex justify-between px-12 pt-12">
                  <div className="w-9 h-9 bg-black rounded-full animate-blink relative">
                    <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full opacity-80" />
                  </div>
                  <div className="w-9 h-9 bg-black rounded-full animate-blink relative" style={{ animationDelay: '0.2s' }}>
                    <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full opacity-80" />
                  </div>
                </div>
                <div className="w-24 h-12 border-b-4 border-orange-800 rounded-b-full mx-auto mt-8 animate-smile" />
                <div className="absolute -left-3 top-14 w-7 h-7 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full opacity-70 animate-ping" />
                <div className="absolute -right-3 top-14 w-7 h-7 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full opacity-70 animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>

              {/* Body */}
              <div className="w-56 h-64 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 rounded-3xl absolute top-32 left-1/2 transform -translate-x-1/2 border-4 border-orange-600 shadow-2xl relative overflow-hidden">
                <div className="absolute top-2 left-4 w-16 h-6 bg-orange-300/40 rounded-full blur-md" />
                <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
                  <div className="text-white font-black text-2xl tracking-wider animate-pulse bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                    TAP N BITE
                  </div>
                </div>

                {/* Left Arm */}
                <div className={`absolute -left-28 top-8 w-12 h-40 bg-gradient-to-b from-orange-300 via-orange-400 to-amber-500 rounded-full origin-top border-4 border-orange-500 shadow-2xl transition-all duration-700 ${
                  armWave ? 'animate-wave-left' : 'animate-idle-left'
                }`}>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-orange-600 rounded-full" />
                </div>

                {/* Right Arm */}
                <div className={`absolute -right-28 top-8 w-12 h-40 bg-gradient-to-b from-orange-300 via-orange-400 to-amber-500 rounded-full origin-top border-4 border-orange-500 shadow-2xl transition-all duration-700 ${
                  armWave ? 'animate-wave-right' : 'animate-idle-right'
                }`}>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-orange-600 rounded-full" />
                </div>
              </div>

              {/* Legs */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-10">
                <div className="w-20 h-36 bg-gradient-to-b from-orange-500 via-orange-600 to-amber-700 rounded-full border-4 border-orange-700 shadow-2xl relative">
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-orange-800 rounded-full" />
                </div>
                <div className="w-20 h-36 bg-gradient-to-b from-orange-500 via-orange-600 to-amber-700 rounded-full border-4 border-orange-700 shadow-2xl relative">
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-orange-800 rounded-full" />
                </div>
              </div>

              {/* Coming Soon Board */}
              <div className={`absolute -top-44 left-1/2 -translate-x-1/2 transform transition-all duration-1000 sm:-top-[11.5rem] md:-top-48 ${
                characterPosition === 0 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}>
                <div className="relative">
                  <div className={`absolute inset-0 bg-orange-400 rounded-3xl blur-xl opacity-30 transition-all duration-1000 ${
                    glow ? 'scale-110 opacity-50' : 'scale-100 opacity-20'
                  }`} />
                  <div className="relative z-10 flex h-40 w-[280px] flex-col items-center justify-center rounded-3xl border-4 border-orange-500 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-100 p-4 shadow-2xl sm:h-48 sm:w-[340px] sm:p-5 md:h-56 md:w-[420px] md:p-6 lg:h-64 lg:w-[480px] lg:border-[6px] lg:p-8">
                    <div className="absolute -left-7 top-1/2 h-20 w-7 -translate-y-1/2 transform rounded-full border-2 border-orange-700 bg-gradient-to-b from-orange-600 via-amber-600 to-orange-800 shadow-lg sm:-left-8 sm:h-24 sm:w-8 md:-left-10 md:h-28 md:w-10" />
                    <div className="absolute -right-7 top-1/2 h-20 w-7 -translate-y-1/2 transform rounded-full border-2 border-orange-700 bg-gradient-to-b from-orange-600 via-amber-600 to-orange-800 shadow-lg sm:-right-8 sm:h-24 sm:w-8 md:-right-10 md:h-28 md:w-10" />
                    <div className="text-center relative z-20">
                      <div className="mb-3 bg-gradient-to-r from-orange-600 via-red-500 to-orange-700 bg-clip-text text-3xl font-black tracking-tight text-transparent animate-glow-text sm:mb-4 sm:text-4xl md:text-5xl lg:mb-6 lg:text-7xl">
                        COMING SOON
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-lg sm:mt-2 sm:h-3" />
                    </div>
                    <div className="absolute left-3 top-3 h-4 w-4 rounded-full bg-orange-500 opacity-60 animate-pulse sm:left-4 sm:top-4 sm:h-6 sm:w-6" />
                    <div className="absolute right-3 top-3 h-4 w-4 rounded-full bg-orange-500 opacity-60 animate-pulse sm:right-4 sm:top-4 sm:h-6 sm:w-6" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute bottom-3 left-3 h-4 w-4 rounded-full bg-orange-500 opacity-60 animate-pulse sm:bottom-4 sm:left-4 sm:h-6 sm:w-6" style={{ animationDelay: '0.6s' }} />
                    <div className="absolute bottom-3 right-3 h-4 w-4 rounded-full bg-orange-500 opacity-60 animate-pulse sm:bottom-4 sm:right-4 sm:h-6 sm:w-6" style={{ animationDelay: '0.9s' }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Prompt */}
        <div className={`absolute bottom-4 left-1/2 z-20 w-full max-w-md -translate-x-1/2 transform px-4 transition-all duration-1000 delay-2000 sm:bottom-6 md:bottom-8 ${
          showPrompt ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="w-full rounded-2xl border-2 border-orange-400 bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-3 text-center text-white shadow-2xl sm:px-8 sm:py-4">
            <p className="text-xs opacity-90 sm:text-sm">
              We'll be back soon with something amazing!
            </p>
          </div>
        </div>

      </div>
    </>
  );
};

export default ProfessionalComingSoon;
