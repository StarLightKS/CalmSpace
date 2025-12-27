
import React, { useState, useEffect } from 'react';

interface MeditationTimerProps {
  onClose: () => void;
}

const MeditationTimer: React.FC<MeditationTimerProps> = ({ onClose }) => {
  const [seconds, setSeconds] = useState(180); // 3 minutes

  useEffect(() => {
    if (seconds === 0) {
      onClose();
      return;
    }
    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds, onClose]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-moon text-indigo-500 text-3xl"></i>
        </div>
        <h2 className="text-2xl font-semibold mb-2 text-slate-800">Медитация</h2>
        <p className="text-slate-500 mb-6 italic">
          «Сядь удобно, сосредоточься на дыхании, мягко возвращай внимание»
        </p>
        
        <div className="text-6xl font-light text-indigo-600 mb-10 tracking-wider">
          {formatTime(seconds)}
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-10">
          <div 
            className="bg-indigo-500 h-full transition-all duration-1000"
            style={{ width: `${(seconds / 180) * 100}%` }}
          ></div>
        </div>

        <button 
          onClick={onClose}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-3 rounded-full transition-colors font-medium"
        >
          Закончить раньше
        </button>
      </div>
    </div>
  );
};

export default MeditationTimer;
