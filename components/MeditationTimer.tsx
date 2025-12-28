
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface MeditationTimerProps {
  language: Language;
  onClose: () => void;
}

const translations = {
  ru: {
    title: 'Медитация',
    desc: '«Закрой глаза, дыши глубоко и позволь мыслям течь сквозь тебя»',
    finish: 'ЗАВЕРШИТЬ'
  },
  en: {
    title: 'Meditation',
    desc: '«Close your eyes, breathe deeply and let your thoughts flow through you»',
    finish: 'FINISH'
  }
};

const MeditationTimer: React.FC<MeditationTimerProps> = ({ language, onClose }) => {
  const t = translations[language];
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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate__animated animate__fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-transparent dark:border-slate-800 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <i className="fa-solid fa-leaf text-indigo-500 dark:text-indigo-400 text-4xl"></i>
        </div>
        <h2 className="text-3xl font-bold mb-3 text-slate-800 dark:text-slate-100">{t.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 italic text-sm px-4">
          {t.desc}
        </p>
        
        <div className="text-7xl font-extralight text-indigo-600 dark:text-indigo-400 mb-12 tracking-widest">
          {formatTime(seconds)}
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-12 border dark:border-slate-700 shadow-inner">
          <div 
            className="bg-indigo-500 dark:bg-indigo-400 h-full transition-all duration-1000"
            style={{ width: `${(seconds / 180) * 100}%` }}
          ></div>
        </div>

        <button 
          onClick={onClose}
          className="bg-slate-950 dark:bg-white dark:text-slate-950 text-white hover:opacity-90 px-10 py-4 rounded-full transition-all font-bold shadow-xl active:scale-95"
        >
          {t.finish}
        </button>
      </div>
    </div>
  );
};

export default MeditationTimer;
