
import React, { useState, useEffect, useCallback } from 'react';
import { ExerciseType } from '../types';

interface BreathingExerciseProps {
  type: ExerciseType;
  onClose: () => void;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ type, onClose }) => {
  const [phase, setPhase] = useState<'Вдох' | 'Выдох' | 'Задержка'>('Вдох');
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const start46 = useCallback(() => {
    let currentCycle = 1;
    const run = async () => {
      while (currentCycle <= 8 && isActive) {
        setCycle(currentCycle);
        // Inhale 4
        setPhase('Вдох');
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        // Exhale 6
        setPhase('Выдох');
        for (let i = 6; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        currentCycle++;
      }
      onClose();
    };
    run();
  }, [isActive, onClose]);

  const startBox = useCallback(() => {
    const run = async () => {
      while (isActive) {
        setPhase('Вдох');
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        setPhase('Задержка');
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        setPhase('Выдох');
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
        setPhase('Задержка');
        for (let i = 4; i > 0; i--) { setTimeLeft(i); await new Promise(r => setTimeout(r, 1000)); if(!isActive) return; }
      }
    };
    run();
  }, [isActive]);

  useEffect(() => {
    if (type === ExerciseType.BREATHING_4_6) start46();
    if (type === ExerciseType.BOX_BREATHING) startBox();
    
    return () => setIsActive(false);
  }, [type, start46, startBox]);

  const getScale = () => {
    if (phase === 'Вдох') return 'scale-150';
    if (phase === 'Выдох') return 'scale-100';
    return 'scale-125'; // For Hold
  };

  const getBgColor = () => {
    if (phase === 'Вдох') return 'bg-emerald-400';
    if (phase === 'Выдох') return 'bg-blue-400';
    return 'bg-amber-400';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold mb-2 text-slate-800">
          {type === ExerciseType.BREATHING_4_6 ? 'Дыхание 4-6' : 'Коробочное дыхание'}
        </h2>
        <p className="text-slate-500 mb-8">
          {type === ExerciseType.BREATHING_4_6 ? `Цикл ${cycle} из 8` : 'Продолжайте до ощущения спокойствия'}
        </p>

        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          <div className={`absolute w-32 h-32 rounded-full transition-all duration-[1000ms] ${getScale()} ${getBgColor()} opacity-20`}></div>
          <div className={`absolute w-24 h-24 rounded-full transition-all duration-[1000ms] ${getScale()} ${getBgColor()} opacity-40`}></div>
          <div className={`w-16 h-16 rounded-full transition-all duration-[1000ms] ${getScale()} ${getBgColor()} shadow-lg flex items-center justify-center text-white font-bold text-xl`}>
            {timeLeft}
          </div>
        </div>

        <div className="text-3xl font-medium text-slate-700 mb-8 animate-pulse">
          {phase}
        </div>

        <button 
          onClick={onClose}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2 rounded-full transition-colors font-medium"
        >
          Завершить
        </button>
      </div>
    </div>
  );
};

export default BreathingExercise;
