import { useState, useEffect, useRef } from 'react';
import { useLiveAPI } from './hooks/useLiveAPI';
import { Mic, MicOff, Globe, MessageSquare, Settings, Loader2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LANGUAGES = [
  { id: 'Spanish', name: 'Spanish', flag: '🇪🇸' },
  { id: 'French', name: 'French', flag: '🇫🇷' },
  { id: 'Japanese', name: 'Japanese', flag: '🇯🇵' },
  { id: 'German', name: 'German', flag: '🇩🇪' },
  { id: 'Italian', name: 'Italian', flag: '🇮🇹' },
  { id: 'Mandarin Chinese', name: 'Mandarin', flag: '🇨🇳' },
];

const SCENARIOS = [
  { id: 'casual', name: 'Casual Conversation', desc: 'Chat about hobbies, weather, and daily life.' },
  { id: 'restaurant', name: 'Ordering at a Restaurant', desc: 'Practice ordering food, asking for recommendations, and paying the bill.' },
  { id: 'travel', name: 'Travel & Directions', desc: 'Ask for directions, buy tickets, and navigate a new city.' },
  { id: 'interview', name: 'Job Interview', desc: 'Practice formal language and answering professional questions.' },
];

const VOICES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];

export default function App() {
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [scenario, setScenario] = useState(SCENARIOS[0].id);
  const [voice, setVoice] = useState(VOICES[0]);
  
  const { connected, connecting, connect, disconnect, transcripts, error } = useLiveAPI();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  const handleStart = () => {
    const selectedScenario = SCENARIOS.find(s => s.id === scenario)?.desc || 'Casual conversation';
    connect(language, selectedScenario, voice);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">LinguaLive</h1>
          </div>
          {connected && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Session
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!connected && !connecting ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight">Practice speaking naturally.</h2>
                <p className="text-stone-500">Choose a language and scenario to start a real-time voice conversation with your AI partner.</p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-8">
                {/* Language Selection */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                    <Globe size={16} /> Language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => setLanguage(lang.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          language === lang.id 
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-xl mb-1 block">{lang.flag}</span>
                        <span className="font-medium text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario Selection */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                    <MessageSquare size={16} /> Scenario
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {SCENARIOS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setScenario(s.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          scenario === s.id 
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">{s.name}</div>
                        <div className="text-xs text-stone-500 leading-relaxed">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Selection */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                    <Settings size={16} /> AI Voice
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VOICES.map(v => (
                      <button
                        key={v}
                        onClick={() => setVoice(v)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          voice === v
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleStart}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-medium text-lg shadow-sm transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Mic size={20} />
                  Start Conversation
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]"
            >
              {/* Active Session Header */}
              <div className="bg-white rounded-t-2xl border border-stone-200 p-6 flex items-center justify-between shadow-sm z-10">
                <div>
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    {LANGUAGES.find(l => l.id === language)?.flag} Practicing {language}
                  </h2>
                  <p className="text-sm text-stone-500">{SCENARIOS.find(s => s.id === scenario)?.name}</p>
                </div>
                
                <button
                  onClick={disconnect}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <MicOff size={16} />
                  End Call
                </button>
              </div>

              {/* Transcript Area */}
              <div className="flex-1 bg-stone-100 border-x border-stone-200 overflow-y-auto p-6 space-y-6">
                {connecting ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <p>Connecting to AI partner...</p>
                  </div>
                ) : transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                    <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center animate-pulse">
                      <Volume2 size={24} className="text-stone-400" />
                    </div>
                    <p>Listening... Start speaking!</p>
                  </div>
                ) : (
                  transcripts.map((t, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                        t.role === 'user' 
                          ? 'bg-emerald-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm'
                      }`}>
                        <div className="text-xs font-medium opacity-70 mb-1">
                          {t.role === 'user' ? 'You' : voice}
                        </div>
                        <p className="leading-relaxed">{t.text}</p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Bottom Visualizer Area */}
              <div className="bg-white rounded-b-2xl border border-stone-200 p-6 shadow-sm flex items-center justify-center">
                {connecting ? (
                  <div className="text-sm text-stone-500 font-medium">Establishing connection...</div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                      <Mic size={16} className="animate-pulse" />
                      Microphone Active
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
