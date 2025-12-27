
import React, { useState, useEffect, useRef } from 'react';
import { Message, ExerciseType, MoodEntry, UserProfile } from './types';
import { getGeminiResponse } from './services/geminiService';
import BreathingExercise from './components/BreathingExercise';
import MeditationTimer from './components/MeditationTimer';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('zen_messages');
    if (saved) {
      return JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [{
      id: '1',
      role: 'bot',
      text: 'Привет! Я ZenStudent. Я здесь, чтобы поддержать тебя. О чем ты думаешь сейчас?',
      timestamp: new Date(),
    }];
  });

  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('zen_moods');
    return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [];
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('zen_profile');
    return saved ? JSON.parse(saved) : { trustedContactName: '', trustedContactEmail: '', reminderEnabled: false };
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeExercise, setActiveExercise] = useState<ExerciseType>(ExerciseType.NONE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('zen_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('zen_moods', JSON.stringify(moodHistory));
  }, [moodHistory]);

  useEffect(() => {
    localStorage.setItem('zen_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const checkRisk = (text: string) => {
    const riskKeywords = ['убить', 'суицид', 'смерть', 'порезать', 'навредить себе', 'самоубийство', 'конец всему', 'вскрыть вены', 'умереть'];
    return riskKeywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const isHighRisk = checkRisk(textToSend);
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
      isHighRisk,
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    // Automatic Notification Logic
    if (isHighRisk) {
      const contactInfo = profile.trustedContactEmail || "указанный контакт";
      const contactName = profile.trustedContactName || "доверенное лицо";
      
      setLastNotification(`⚠️ Уведомление автоматически отправлено: ${contactName} (${contactInfo})`);
      
      // Simulate API call to notification service
      console.log(`Sending alert to ${contactInfo}: Ваш близкий указал вас как доверенное лицо. Сейчас ему может потребоваться поддержка. Пожалуйста, свяжитесь с ним.`);
      
      setTimeout(() => setLastNotification(null), 8000);
    }

    const history = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }]
    }));
    history.push({ role: 'user', parts: [{ text: textToSend }] });

    const botReply = await getGeminiResponse(history);
    
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      text: botReply,
      timestamp: new Date(),
    }]);
    setIsLoading(false);
  };

  const addMood = (score: number) => {
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      score,
      timestamp: new Date(),
    };
    setMoodHistory(prev => [newEntry, ...prev].slice(0, 10));
    setShowMoodPicker(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'bot',
      text: `Я сохранил твою оценку (${score}/5). Спасибо, что делишься со мной.`,
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* High Risk Status Bar */}
      {lastNotification && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 text-white px-6 py-4 shadow-2xl animate-in slide-in-from-top duration-500 flex items-center justify-center gap-4">
          <i className="fa-solid fa-triangle-exclamation text-xl animate-pulse"></i>
          <span className="text-sm font-bold tracking-wide">{lastNotification}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fa-solid fa-leaf"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">ZenStudent</h1>
            </div>

            <nav className="space-y-6">
              {/* Mood History */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Настроение</p>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-end gap-1 h-10 mb-2">
                    {moodHistory.length === 0 ? <div className="w-full text-center text-[10px] text-slate-400">Нет данных</div> : 
                      moodHistory.slice().reverse().map((m) => (
                        <div key={m.id} style={{ height: `${(m.score / 5) * 100}%` }} className={`flex-1 rounded-sm ${m.score > 3 ? 'bg-emerald-400' : m.score > 1 ? 'bg-indigo-400' : 'bg-rose-400'}`} />
                      ))
                    }
                  </div>
                  <button onClick={() => setShowMoodPicker(true)} className="w-full py-1 text-[11px] font-bold text-indigo-600 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors">
                    ОТМЕТИТЬ
                  </button>
                </div>
              </div>

              {/* Quick Practices */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Практики</p>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => setActiveExercise(ExerciseType.BREATHING_4_6)} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors">
                    <i className="fa-solid fa-wind"></i> Дыхание 4-6
                  </button>
                  <button onClick={() => setActiveExercise(ExerciseType.BOX_BREATHING)} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                    <i className="fa-solid fa-square"></i> Коробочное
                  </button>
                  <button onClick={() => setActiveExercise(ExerciseType.MEDITATION)} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                    <i className="fa-solid fa-spa"></i> Медитация
                  </button>
                </div>
              </div>

              {/* Safety Contact */}
              <div className="pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Доверенное лицо</p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold ml-1">ИМЯ</label>
                    <input type="text" className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg outline-none" value={profile.trustedContactName} onChange={e => setProfile({...profile, trustedContactName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold ml-1">EMAIL / ТЕЛЕФОН</label>
                    <input type="text" className="w-full bg-white border border-slate-200 text-xs p-2 rounded-lg outline-none" value={profile.trustedContactEmail} onChange={e => setProfile({...profile, trustedContactEmail: e.target.value})} />
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-500 p-2">
            <i className={`fa-solid ${isSidebarOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
          <div className="text-center md:text-left flex-1 md:ml-2">
            <h2 className="font-bold text-slate-800 text-sm">Чат поддержки</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm text-sm
                ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-100'}
                ${msg.isHighRisk ? 'ring-4 ring-rose-500/20 bg-rose-50 border-rose-200 text-rose-900' : ''}
              `}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest ml-2 animate-pulse">Бот печатает...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Static Disclaimer and Footer Input */}
        <footer className="bg-white border-t border-slate-100 p-4 md:p-6">
          {showMoodPicker && (
            <div className="mb-4 bg-white p-4 rounded-2xl shadow-xl border border-indigo-50 animate-in slide-in-from-bottom-2">
              <p className="text-center text-xs font-bold text-slate-600 mb-3">Как ты сейчас?</p>
              <div className="flex justify-between gap-1">
                {[0, 1, 2, 3, 4, 5].map(num => (
                  <button key={num} onClick={() => addMood(num)} className="flex-1 h-10 rounded-lg text-sm font-bold bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-slate-100">{num}</button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3 bg-slate-50 p-1.5 pl-5 rounded-full border border-slate-200">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Напиши сообщение..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none py-2"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-20 transition-all shadow-md active:scale-90"
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </form>

          {/* Persistent Disclaimer */}
          <div className="mt-4 text-center">
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter opacity-70">
              ZenStudent — это ИИ-ассистент, а не профессиональная помощь. В экстренной ситуации звоните 112 или 103.
            </p>
          </div>
        </footer>

        {/* Overlays */}
        {activeExercise === ExerciseType.BREATHING_4_6 && (
          <BreathingExercise type={ExerciseType.BREATHING_4_6} onClose={() => { setActiveExercise(ExerciseType.NONE); setShowMoodPicker(true); }} />
        )}
        {activeExercise === ExerciseType.BOX_BREATHING && (
          <BreathingExercise type={ExerciseType.BOX_BREATHING} onClose={() => { setActiveExercise(ExerciseType.NONE); setShowMoodPicker(true); }} />
        )}
        {activeExercise === ExerciseType.MEDITATION && (
          <MeditationTimer onClose={() => { setActiveExercise(ExerciseType.NONE); setShowMoodPicker(true); }} />
        )}
      </main>
    </div>
  );
};

export default App;
