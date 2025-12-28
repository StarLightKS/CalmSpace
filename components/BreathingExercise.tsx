
import React, { useState, useEffect, useCallback } from 'react';
import { ExerciseType, Language } from '../types';

interface BreathingExerciseProps {
  type: ExerciseType;
  language: Language;
  onClose: () => void;
}

const translations = {
  ru: {
    inhale: 'Вдох',
    exhale: 'Выдох',
    hold: 'Задержка',
    cycle: 'Цикл',
    of: 'из',
    finish: 'Завершить',
    continue: 'Продолжайте до ощущения спокойствия',
    title46: 'Дыхание 4-6',
    titleBox: 'Коробочное дыхание'
  },
  en: {
    inhale: 'Inhale',
    exhale: 'Exhale',
    hold: 'Hold',
    cycle: 'Cycle',
    of: 'of',
    finish: 'Finish',
    continue: 'Continue until you feel calm',
    title46: '4-6 Breathing',
    titleBox: 'Box Breathing'
  }
};

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ type, language, onClose }) => {
  const t = translations[language];
  const [phase, setPhase] = useState<string>(t.inhale);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const start46 = useCallback(() => {
    let currentCycle = 1;
    const run = async () => {
      while (currentCycle <= 8 && isActive) {
        setCycle(currentCycle);
        // Inhale 4
        setPhase(t.inhale);
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        // Exhale 6
        setPhase(t.exhale);
        for (let i = 6; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        currentCycle++;
      }
      onClose();
    };
    run();
  }, [isActive, onClose, t]);

  const startBox = useCallback(() => {
    const run = async () => {
      while (isActive) {
        setPhase(t.inhale);
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        setPhase(t.hold);
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        setPhase(t.exhale);
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        setPhase(t.hold);
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
      }
    };
    run();
  }, [isActive, t]);

  useEffect(() => {
    if (type === ExerciseType.BREATHING_4_6) start46();
    if (type === ExerciseType.BOX_BREATHING) startBox();
    
    return () => setIsActive(false);
  }, [type, start46, startBox]);

  const getScale = () => {
    if (phase === t.inhale) return 'scale-150';
    if (phase === t.exhale) return 'scale-100';
    return 'scale-125'; // For Hold
  };

  const getBgColor = () => {
    if (phase === t.inhale) return 'bg-emerald-400 dark:bg-emerald-500';
    if (phase === t.exhale) return 'bg-blue-400 dark:bg-blue-500';
    return 'bg-amber-400 dark:bg-amber-500';
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-transparent dark:border-slate-800 flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">
          {type === ExerciseType.BREATHING_4_6 ? t.title46 : t.titleBox}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {type === ExerciseType.BREATHING_4_6 ? `${t.cycle} ${cycle} ${t.of} 8` : t.continue}
        </p>

        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          <div className={`absolute w-32 h-32 rounded-full transition-all duration-[1000ms] ${getScale()} ${getBgColor()} opacity-20`}></div>
          <div className={`absolute w-24 h-24 rounded-full transition-all duration-[1000ms] ${getScale()} ${getBgColor()} opacity-40`}></div>
          <div className={`w-16 h-16 rounded-full transition-all duration-[1000ms] ${getScale()} ${getBgColor()} shadow-lg flex items-center justify-center text-white font-bold text-xl`}>
            {timeLeft}
          </div>
        </div>

        <div className="text-3xl font-medium text-slate-700 dark:text-slate-200 mb-8 animate-pulse">
          {phase}
        </div>

        <button 
          onClick={onClose}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-2 rounded-full transition-colors font-medium border border-transparent dark:border-slate-700"
        >
          {t.finish}
        </button>
      </div>
    </div>
  );
};

export default BreathingExercise;
