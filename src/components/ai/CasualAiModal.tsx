import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Search,
  MapPin,
  Trash2,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Receipt,
  Vote,
} from 'lucide-react';
import { playSound } from '../../utils/sound';
import { triggerHaptic } from '../../utils/haptics';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingMetadata?: any;
  timestamp: string;
}

export const CasualAiModal: React.FC = () => {
  const { isAiChatOpen, setIsAiChatOpen, adminConfig, db, currency } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hi there! I'm your HUB BUDDY! 🤖 Ask me anything about your tasks, budget, receipts, or voting decisions! You can also tap the mic to speak!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [useMaps, setUseMaps] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isAiChatOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);
    playSound.pop();
    triggerHaptic.light();

    try {
      const personality = adminConfig.aiPersonality || 'buddy';
      let systemPrompt =
        'You are HUB BUDDY, a cheerful, simple, and encouraging assistant for Big Button Life Hub. ' +
        'Keep answers very short, friendly, and easy to understand for all ages. Use simple analogies and giant button concepts.';

      if (personality === 'coach') {
        systemPrompt =
          'You are FINANCIAL COACH, a helpful money mentor for Big Button Life Hub. Explain spending and budgets in clear, encouraging terms without financial jargon.';
      } else if (personality === 'mediator') {
        systemPrompt =
          'You are CONSENSUS GUIDE, a fair mediator helping team members resolve objections and reach unanimous agreement.';
      }

      // Add context about hub state
      const categorySpending: Record<string, number> = {};
      db.ledger.filter((l) => l.type === 'expense').forEach((l) => {
        categorySpending[l.categoryId] = (categorySpending[l.categoryId] || 0) + l.amountCents;
      });
      const hubSummary = `Active Currency: ${currency.code}. Total Tasks: ${db.tasks.length} (${db.tasks.filter(t => !t.completed).length} pending). Monthly Budget Categories: ${db.budgetCategories.map(c => `${c.name}: spent ${((categorySpending[c.id] || 0)/100).toFixed(2)} of ${(c.allocatedCents/100).toFixed(2)}`).join(', ')}. Open Consensus Proposals: ${db.proposals.filter(p => p.status === 'open').length}.`;
      systemPrompt += ` Current Hub Context: ${hubSummary}`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          systemInstruction: systemPrompt,
          useSearch,
          useMaps,
          model: 'gemini-3.8-flash',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([
          ...newMessages,
          {
            role: 'model',
            text: data.reply,
            groundingMetadata: data.groundingMetadata,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        playSound.toggle();
        triggerHaptic.medium();
      } else {
        throw new Error('AI response error');
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'model',
          text: "I'm still right here! Everything in your Life Hub is running safely. Let me know if you want to check your budget or view your tasks!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Recording & Speech-to-Text Transcription via gemini-3.5-transcribe
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsLoading(true);
          try {
            const res = await fetch('/api/ai/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType: 'audio/webm',
              }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                setInputText(data.text);
                playSound.success();
                triggerHaptic.medium();
              }
            }
          } catch (err) {
            console.error('Transcription error:', err);
          } finally {
            setIsLoading(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      playSound.pop();
      triggerHaptic.heavy();
    } catch (err) {
      alert('Microphone permission required for audio input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      playSound.pop();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'model',
        text: "Chat cleared! How can I help you next, friend? 🌟",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    playSound.trash();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border-4 border-slate-900 rounded-3xl shadow-[8px_8px_0px_#000000] h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-400 text-slate-900 px-5 py-3.5 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg tracking-tight">HUB BUDDY AI</h3>
                <span className="text-[10px] font-black bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full border border-slate-900">
                  GEMINI 3.8
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700">Simple, friendly answers & ideas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="chunky-btn p-2 rounded-xl bg-yellow-200 hover:bg-yellow-300 text-slate-900 border-2 border-slate-900"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsAiChatOpen(false)}
              className="chunky-btn p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-900"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Grounding Controls Pill Bar */}
        <div className="bg-amber-100/70 px-4 py-2 border-b-2 border-slate-900 flex items-center justify-between text-xs font-black">
          <span className="text-slate-700">GROUNDING TOOLS:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseSearch(!useSearch)}
              className={`chunky-btn px-2.5 py-1 rounded-lg border-2 border-slate-900 flex items-center gap-1.5 transition-colors ${
                useSearch ? 'bg-sky-400 text-slate-900' : 'bg-white text-slate-500'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
            <button
              onClick={() => setUseMaps(!useMaps)}
              className={`chunky-btn px-2.5 py-1 rounded-lg border-2 border-slate-900 flex items-center gap-1.5 transition-colors ${
                useMaps ? 'bg-emerald-400 text-slate-900' : 'bg-white text-slate-500'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Maps</span>
            </button>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-amber-50/50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_#000] text-sm font-bold ${
                  msg.role === 'user'
                    ? 'bg-yellow-300 text-slate-900 rounded-tr-none'
                    : 'bg-white text-slate-900 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                {msg.groundingMetadata?.webSearchQueries && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-sky-700 font-bold flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    <span>Verified via Google Search</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black text-slate-500 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0px_#000] max-w-[160px] animate-pulse font-black text-xs text-slate-700">
              <Bot className="w-4 h-4 text-purple-600 animate-spin" />
              <span>Buddy is thinking...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-3 py-2 bg-white border-t-2 border-slate-900 overflow-x-auto flex items-center gap-2 no-scrollbar">
          {[
            { label: '💰 Am I over budget?', query: 'How is my monthly budget looking right now?' },
            { label: '📝 What is due today?', query: 'What tasks do I have scheduled for today?' },
            { label: '📍 Find hardware shop', query: 'Where is the nearest Builders Warehouse or hardware store?' },
            { label: '🗳️ Consensus check', query: 'Are there any consensus decisions waiting for my vote?' },
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.query)}
              className="chunky-btn whitespace-nowrap px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 text-xs font-black text-slate-900 shadow-[2px_2px_0px_#000] shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t-4 border-slate-900 flex items-center gap-2">
          {/* Audio recording button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`chunky-btn w-12 h-12 rounded-2xl border-3 border-slate-900 flex items-center justify-center font-black transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-[2px_2px_0px_#000]'
                : 'bg-purple-300 hover:bg-purple-400 text-slate-900 shadow-[2px_2px_0px_#000]'
            }`}
            title={isRecording ? 'Stop Recording' : 'Speak into Microphone'}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? 'Listening to your voice...' : 'Ask Hub Buddy anything...'}
            disabled={isRecording}
            className="flex-1 h-12 px-4 rounded-2xl border-3 border-slate-900 bg-amber-50 font-bold text-slate-900 text-sm focus:outline-none focus:bg-white"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="chunky-btn h-12 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-3 border-slate-900 font-black text-sm flex items-center gap-1.5 shadow-[3px_3px_0px_#000] active:translate-y-1 disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">SEND</span>
          </button>
        </div>
      </div>
    </div>
  );
};
