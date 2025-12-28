import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Message, ExerciseType, MoodEntry, UserProfile, TrustedContact, Language, Theme } from './types';
import { getGeminiResponse } from './services/geminiService';
import BreathingExercise from './components/BreathingExercise';
import MeditationTimer from './components/MeditationTimer';

// Reliable direct link for deeply calm meditative music from Pixabay
const AMBIENT_URLS: Record<string, string> = {
  'Спокойная музыка': 'https://cdn.pixabay.com/audio/2022/08/02/audio_8845214669.mp3',
  'Calm Music': 'https://cdn.pixabay.com/audio/2022/08/02/audio_8845214669.mp3',
};

const CalmSpaceLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg">
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" opacity="0.2" />
      <path className="wave-animate" d="M0 50 Q 25 35, 50 50 T 100 50 V 100 H 0 Z" fill="rgba(255,255,255,0.4)" />
      <path className="wave-animate" style={{ animationDelay: '-1.5s' }} d="M0 60 Q 25 45, 50 60 T 100 60 V 100 H 0 Z" fill="rgba(255,255,255,0.6)" />
    </svg>
  </div>
);

const translations = {
  ru: {
    welcome: 'Привет. Я твой помощник CalmSpace. Что ты чувствуешь прямо сейчас? Я здесь, чтобы выслушать. ✨',
    moodTitle: 'Настроение',
    moodButton: 'ОЦЕНИТЬ',
    moodSaved: 'Спасибо, что поделился. Я рядом. ✨',
    emergencyTitle: 'Доверенные лица',
    contactHint: 'Контакты на крайний случай.',
    practiceTitle: 'Практики',
    exercise46: 'Дыхание 4-6',
    exerciseMeditation: 'Медитация',
    voiceButton: 'Голос',
    quietMode: 'Тихий режим',
    sleepTitle: 'Цикл сна',
    chatTitle: 'CalmSpace',
    crisisTitle: 'НУЖНА ПОМОЩЬ?',
    sosButton: 'SOS',
    inputPlaceholder: 'Как ты себя чувствуешь?',
    typing: 'CalmSpace слушает...',
    disclaimer: 'Я лишь помощник. В экстренной ситуации звони 112.',
    startSleep: 'Сон:',
    endSleep: 'Подъем:',
    addContact: 'Контакт'
  },
  en: {
    welcome: "Hello. I'm your CalmSpace assistant. How are you feeling right now? I'm here to listen. ✨",
    moodTitle: 'Mood Tracker',
    moodButton: 'RATE',
    moodSaved: 'Thank you for sharing. I am here. ✨',
    emergencyTitle: 'Trusted Circle',
    contactHint: 'Emergency contacts.',
    practiceTitle: 'Exercises',
    exercise46: '4-6 Breath',
    exerciseMeditation: 'Meditation',
    voiceButton: 'Voice',
    quietMode: 'Quiet Mode',
    sleepTitle: 'Sleep',
    chatTitle: 'CalmSpace Chat',
    crisisTitle: 'NEED HELP?',
    sosButton: 'SOS',
    inputPlaceholder: 'How are you feeling?',
    typing: 'CalmSpace is listening...',
    disclaimer: 'I am an AI. In crisis, call 911.',
    startSleep: 'Sleep:',
    endSleep: 'Wake:',
    addContact: 'Contact'
  }
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('calm_profile');
    return saved ? JSON.parse(saved) : { 
      trustedContacts: [{ name: '', contact: '' }],
      language: 'ru',
      theme: 'light',
      sleepTime: '23:00',
      wakeTime: '07:00',
      isQuietMode: false
    };
  });

  const t = translations[profile.language];
  const isDark = profile.theme === 'dark';

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('calm_messages');
    if (saved) return JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    return [{ id: '1', role: 'bot', text: t.welcome, timestamp: new Date() }];
  });

  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('calm_moods');
    return saved ? JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeExercise, setActiveExercise] = useState<ExerciseType>(ExerciseType.NONE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    localStorage.setItem('calm_messages', JSON.stringify(messages));
    localStorage.setItem('calm_moods', JSON.stringify(moodHistory));
    localStorage.setItem('calm_profile', JSON.stringify(profile));
    document.documentElement.classList.toggle('dark', isDark);
  }, [messages, moodHistory, profile, isDark]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Ambient sound management
  useEffect(() => {
    if (activeAmbient) {
      if (!ambientAudioRef.current) {
        ambientAudioRef.current = new Audio();
        ambientAudioRef.current.loop = true;
      }
      
      const soundUrl = AMBIENT_URLS[activeAmbient];
      if (soundUrl) {
        ambientAudioRef.current.src = soundUrl;
        ambientAudioRef.current.load();
        ambientAudioRef.current.play().catch(e => {
          console.warn("Autoplay blocked. Music will start after interaction.", e);
        });
      }
    } else {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current.currentTime = 0;
      }
    }
    return () => {
      ambientAudioRef.current?.pause();
    };
  }, [activeAmbient]);

  // Automatic calm music for meditation
  useEffect(() => {
    if (activeExercise === ExerciseType.MEDITATION) {
      setActiveAmbient(profile.language === 'ru' ? 'Спокойная музыка' : 'Calm Music');
    } else if (activeExercise === ExerciseType.NONE) {
      setActiveAmbient(null);
    }
  }, [activeExercise, profile.language]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const textToSend = inputValue;
    const isHighRisk = ['убить', 'смерть', 'суицид', 'kill', 'suicide', 'die'].some(k => textToSend.toLowerCase().includes(k));
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date(), isHighRisk }]);
    setInputValue('');
    setIsLoading(true);

    if (isHighRisk) setIsCrisisMode(true);

    const history = {
      role: 'user' as const,
      parts: [{ text: textToSend }]
    };

    const context = `The user is interacting with Youper (branded as CalmSpace). User setting: ${profile.language}. Sleep cycle: ${profile.sleepTime}-${profile.wakeTime}. IMPORTANT: Respond in the language used by the user in this specific message. If the user writes in Russian, you must reply in Russian. If the user writes in English, you must reply in English.`;
    const botReply = await getGeminiResponse(history, context);
    
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: botReply, timestamp: new Date() }]);
    setIsLoading(false);
  };

  const startVoiceSession = async () => {
    setActiveExercise(ExerciseType.VOICE_LIVE);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = audioContextRef.current.createGain();
    outputNode.connect(audioContextRef.current.destination);

    let nextStartTime = 0;

    const session = await ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: "You are Youper Voice Assistant. You are warm, empathetic, and professional. Use a calm, therapeutic tone. Listen actively. Respond in the language the user speaks. If the user speaks Russian, respond in Russian."
      },
      callbacks: {
        onopen: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
            session.sendRealtimeInput({ 
              media: { 
                data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))), 
                mimeType: 'audio/pcm;rate=16000' 
              } 
            });
          };
          
          source.connect(processor);
          processor.connect(audioContextRef.current!.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64) {
            const binary = atob(audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = audioContextRef.current!.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
            const source = audioContextRef.current!.createBufferSource();
            source.buffer = buffer;
            source.connect(outputNode);
            nextStartTime = Math.max(nextStartTime, audioContextRef.current!.currentTime);
            source.start(nextStartTime);
            nextStartTime += buffer.duration;
          }
        }
      }
    });
    liveSessionRef.current = session;
  };

  const stopVoiceSession = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    setActiveExercise(ExerciseType.NONE);
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-all duration-500 
      ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6 space-y-8 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalmSpaceLogo />
              <h1 className="text-xl font-bold tracking-tight">CalmSpace</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setProfile({...profile, theme: isDark ? 'light' : 'dark'})} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500">
                <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button onClick={() => setProfile({...profile, language: profile.language === 'ru' ? 'en' : 'ru'})} className="px-2 py-1 text-[10px] font-bold border rounded-full uppercase text-slate-400 hover:text-indigo-500">{profile.language}</button>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.moodTitle}</p>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border dark:border-slate-800">
                <div className="flex gap-1 h-8 mb-3">
                  {moodHistory.slice(-7).map(m => <div key={m.id} style={{ height: `${(m.score/5)*100}%` }} className="flex-1 bg-indigo-400/50 rounded-full self-end" />)}
                </div>
                <button onClick={() => setShowMoodPicker(true)} className="w-full py-2 text-[10px] font-bold bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl uppercase text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition-all">{t.moodButton}</button>
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.sleepTitle}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border dark:border-slate-800">
                  <span className="opacity-50">{t.startSleep}</span>
                  <input type="time" value={profile.sleepTime} onChange={e => setProfile({...profile, sleepTime: e.target.value})} className="w-full mt-1 bg-transparent outline-none" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border dark:border-slate-800">
                  <span className="opacity-50">{t.endSleep}</span>
                  <input type="time" value={profile.wakeTime} onChange={e => setProfile({...profile, wakeTime: e.target.value})} className="w-full mt-1 bg-transparent outline-none" />
                </div>
              </div>
            </section>

            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.emergencyTitle}</p>
              <div className="space-y-2">
                {profile.trustedContacts.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border dark:border-slate-800">
                    <input 
                      placeholder="Имя" 
                      value={c.name} 
                      onChange={e => {
                        const nc = [...profile.trustedContacts];
                        nc[i].name = e.target.value;
                        setProfile({...profile, trustedContacts: nc});
                      }} 
                      className="w-full text-xs bg-transparent outline-none font-semibold"
                    />
                  </div>
                ))}
                {profile.trustedContacts.length < 3 && (
                  <button onClick={() => setProfile({...profile, trustedContacts: [...profile.trustedContacts, { name: '', contact: '' }]})} className="w-full py-2 text-[10px] text-slate-400 border border-dashed rounded-xl">+ {t.addContact}</button>
                )}
              </div>
            </section>

            <section className="pt-4 border-t dark:border-slate-800">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">{t.quietMode}</span>
                <input type="checkbox" checked={profile.isQuietMode} onChange={e => setProfile({...profile, isQuietMode: e.target.checked})} className="hidden" />
                <div className={`w-10 h-5 rounded-full relative transition-colors ${profile.isQuietMode ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${profile.isQuietMode ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </section>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 flex items-center justify-between px-6 border-b dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-500"><i className="fa-solid fa-bars"></i></button>
            <h2 className="font-bold text-sm tracking-tight text-slate-600 dark:text-slate-300">{t.chatTitle}</h2>
          </div>
          <button onClick={startVoiceSession} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
            <i className="fa-solid fa-microphone"></i> {t.voiceButton}
          </button>
        </header>

        {isCrisisMode && (
          <div className="p-6 bg-rose-600 text-white shadow-2xl animate-in slide-in-from-top duration-500 z-40">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-1">{t.crisisTitle}</h3>
                <p className="text-sm opacity-90">{t.disclaimer}</p>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-white text-rose-600 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all"><i className="fa-solid fa-phone mr-2"></i>112</button>
                <button onClick={() => setIsCrisisMode(false)} className="px-6 py-3 bg-rose-500 border border-rose-400 rounded-2xl font-bold text-sm">ЗАКРЫТЬ</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-3xl shadow-sm text-sm transition-all leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-[10px] font-bold text-indigo-400 animate-pulse uppercase tracking-widest pl-2">{t.typing}</div>}
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-4 md:p-8 border-t dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md">
          {showMoodPicker && (
            <div className="mb-6 flex justify-center gap-3 animate-in slide-in-from-bottom">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => {
                  setMoodHistory(prev => [...prev, { id: Date.now().toString(), score: v, timestamp: new Date() }]);
                  setShowMoodPicker(false);
                }} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md border dark:border-slate-700 hover:bg-indigo-500 hover:text-white hover:border-orange-500 transition-all font-bold text-lg active:scale-90">{v}</button>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
            <input 
              type="text" 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              placeholder={t.inputPlaceholder} 
              className="w-full pl-6 pr-16 py-4 rounded-full bg-slate-100 dark:bg-slate-800/50 border dark:border-slate-700 focus:ring-2 ring-indigo-400 outline-none text-sm transition-all"
            />
            <button type="submit" className="absolute right-2 top-2 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-indigo-700">
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </form>
          <div className="mt-4 flex justify-center gap-6">
            <button onClick={() => setActiveExercise(ExerciseType.BREATHING_4_6)} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors">{t.exercise46}</button>
            <button onClick={() => setActiveExercise(ExerciseType.MEDITATION)} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors">{t.exerciseMeditation}</button>
          </div>
        </footer>

        {activeExercise === ExerciseType.VOICE_LIVE && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-white animate__animated animate__fadeIn">
            <div className="relative mb-16 scale-125">
              <div className="w-48 h-48 rounded-full bg-indigo-500/10 animate-ping absolute inset-0"></div>
              <div className="w-48 h-48 rounded-full bg-indigo-500/20 animate-pulse absolute inset-0" style={{ animationDuration: '4s' }}></div>
              <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl relative border-4 border-white/5">
                <div className="flex gap-1.5 items-end h-14">
                   {[1,2,3,4,5,6,7].map(i => (
                     <div key={i} className="w-1.5 bg-white/90 rounded-full animate-voice-bar" 
                          style={{ animationDelay: `${i*0.15}s`, height: `${30 + Math.random()*70}%` }} />
                   ))}
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 tracking-tight">CalmSpace Voice</h3>
            <p className="text-slate-400 text-center max-w-xs mb-16 italic font-light leading-relaxed">
              «Я слушаю тебя. Просто говори, я рядом. ✨»
            </p>
            <button onClick={stopVoiceSession} className="px-16 py-5 bg-rose-600 text-white rounded-full font-bold shadow-2xl hover:bg-rose-500 transition-all active:scale-95 border-b-4 border-rose-800">ЗАВЕРШИТЬ</button>
          </div>
        )}

        {activeExercise === ExerciseType.BREATHING_4_6 && <BreathingExercise type={ExerciseType.BREATHING_4_6} language={profile.language} onClose={() => setActiveExercise(ExerciseType.NONE)} />}
        {activeExercise === ExerciseType.MEDITATION && <MeditationTimer language={profile.language} onClose={() => setActiveExercise(ExerciseType.NONE)} />}
      </main>
      <style>{`
        @keyframes voice-bar {
          0%, 100% { height: 25%; }
          50% { height: 95%; }
        }
        .animate-voice-bar {
          animation: voice-bar 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;