import React, { useState, useRef, useEffect } from 'react';
import type { LiveSession, LiveServerMessage } from '@google/genai';
import { Language } from '../types';
import type { ChatMessage } from '../types';
import { UI_TEXT } from '../constants';
import { liveService, textService } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';
import { BackIcon, MicrophoneIcon, StopIcon, SendIcon } from './icons';

interface MurshadChatProps {
  initialHistory: ChatMessage[];
  language: Language;
  onBack: () => void;
  onSessionLog: (userMessage: string) => void;
}

type SessionStatus = 'idle' | 'connecting' | 'listening' | 'error';

// --- Audio Playback Queue ---
// Ensures smooth, gapless playback of incoming audio chunks.
let nextStartTime = 0;
// FIX: Add type assertion to handle vendor-prefixed webkitAudioContext.
const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
const outputNode = outputAudioContext.createGain();
const sources = new Set<AudioBufferSourceNode>();
outputNode.connect(outputAudioContext.destination);


const MurshadChat: React.FC<MurshadChatProps> = ({ initialHistory, language, onBack, onSessionLog }) => {
  const T = UI_TEXT[language];
  const welcomeMessage: ChatMessage = {
      sender: 'murshad',
      text: language === Language.English 
          ? "Wa alaikum assalam wa rahmatullahi wa barakatuh.\n\nWelcome. I am The Digital Murshad, here to listen with an open heart and offer guidance across the pillars of your Mind, Body, Heart, and Soul.\n\nPlease, share what is on your mind. I am here to support you in finding harmony and peace."
          : "وعلیکم السلام ورحمۃ اللہ وبرکاتہ۔\n\nخوش آمدید۔ میں ڈیجیٹل مرشد ہوں، یہاں آپ کے ذہن، جسم، دل اور روح کے ستونوں پر کھلے دل سے سننے اور رہنمائی فراہم کرنے کے لیے حاضر ہوں۔\n\nبراہ کرم، بتائیں کہ آپ کے ذہن میں کیا ہے۔ میں ہم آہنگی اور سکون تلاش کرنے میں آپ کی مدد کے لیے حاضر ہوں۔"
  };

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage, ...initialHistory]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  
  // State for text input
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // State for real-time transcriptions
  const [currentInputTranscription, setCurrentInputTranscription] = useState('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');

  const sessionRef = useRef<LiveSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, currentInputTranscription, currentOutputTranscription]);

  // Cleanup session on component unmount
  useEffect(() => {
    return () => liveService.close(sessionRef.current);
  }, []);
  
  const handleMicClick = async () => {
    if (sessionStatus === 'listening') {
      liveService.close(sessionRef.current);
      sessionRef.current = null;
      setSessionStatus('idle');
      return;
    }
    if (sessionStatus !== 'idle') return;

    setSessionStatus('connecting');
    const newSession = await liveService.connect(language, {
        onopen: () => setSessionStatus('listening'),
        onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
                setCurrentOutputTranscription(prev => prev + message.serverContent.outputTranscription.text);
            }
            if (message.serverContent?.inputTranscription) {
                setCurrentInputTranscription(prev => prev + message.serverContent.inputTranscription.text);
            }
            if (message.serverContent?.turnComplete) {
                const finalInput = currentInputTranscription + (message.serverContent?.inputTranscription?.text || '');
                const finalOutput = currentOutputTranscription + (message.serverContent?.outputTranscription?.text || '');
                onSessionLog(finalInput);
                setMessages(prev => [
                    ...prev,
                    { sender: 'user', text: finalInput },
                    { sender: 'murshad', text: finalOutput },
                ]);
                setCurrentInputTranscription('');
                setCurrentOutputTranscription('');
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => sources.delete(source));
                source.start(nextStartTime);
                nextStartTime = nextStartTime + audioBuffer.duration;
                sources.add(source);
            }
        },
        onerror: () => setSessionStatus('error'),
        onclose: () => setSessionStatus('idle'),
    });
    sessionRef.current = newSession;
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedInput = inputText.trim();
      if (!trimmedInput || isSending || sessionStatus !== 'idle') return;
  
      setIsSending(true);
      onSessionLog(trimmedInput);
  
      const userMessage: ChatMessage = { sender: 'user', text: trimmedInput };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
  
      const loadingMessage: ChatMessage = { sender: 'murshad', text: '...' };
      setMessages(prev => [...prev, loadingMessage]);
  
      try {
          const history = [...messages, userMessage].filter(m => m.text !== welcomeMessage.text);
          const reply = await textService.sendMessage(trimmedInput, language, history);
          
          setMessages(prev => prev.map(m => m === loadingMessage ? { sender: 'murshad', text: reply } : m));
      } catch (error) {
          console.error("Error sending text message:", error);
          const errorText = language === 'en' ? 'An error occurred.' : 'ایک خرابی پیش آ گئی ہے۔';
          setMessages(prev => prev.map(m => m === loadingMessage ? { sender: 'murshad', text: errorText } : m));
      } finally {
          setIsSending(false);
      }
  };

  const MicButton = () => {
      let icon = <MicrophoneIcon className="w-6 h-6" />;
      let bgColor = "bg-teal-500 hover:bg-teal-600";
      if (sessionStatus === 'connecting') {
          icon = <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>;
          bgColor = "bg-yellow-500";
      } else if (sessionStatus === 'listening') {
          icon = <StopIcon className="w-5 h-5" />;
          bgColor = "bg-red-500 animate-pulse";
      } else if (sessionStatus === 'error') {
          icon = <MicrophoneIcon className="w-6 h-6" />;
          bgColor = "bg-gray-500";
      }
      return (
          <button type="button" onClick={handleMicClick} className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors shrink-0 ${bgColor}`}>
              {icon}
          </button>
      );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 animate-fadeIn">
      <header className="bg-gray-800 p-4 flex items-center shadow-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <BackIcon className="w-6 h-6 text-white" />
        </button>
        <h1 className={`text-xl font-bold text-teal-400 mx-auto ${language === 'ur' ? 'font-urdu' : ''}`}>{T.murshadSession}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${
              msg.sender === 'user' 
              ? 'bg-teal-600 text-white rounded-br-none' 
              : 'bg-gray-700 text-white rounded-bl-none'
            }`}>
              <p className={`whitespace-pre-wrap ${language === 'ur' ? 'font-urdu text-right' : ''}`}>{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Live Transcription Display */}
        {currentInputTranscription && (
            <div className="flex justify-end">
                <div className="max-w-xs p-3 rounded-2xl bg-teal-600/70 text-white/80 rounded-br-none">
                    <p className={`whitespace-pre-wrap ${language === 'ur' ? 'font-urdu text-right' : ''}`}>{currentInputTranscription}</p>
                </div>
            </div>
        )}
        {currentOutputTranscription && (
             <div className="flex justify-start">
                <div className="max-w-xs p-3 rounded-2xl bg-gray-700/70 text-white/80 rounded-bl-none">
                    <p className={`whitespace-pre-wrap ${language === 'ur' ? 'font-urdu text-right' : ''}`}>{currentOutputTranscription}</p>
                </div>
            </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-gray-800 p-2 border-t border-gray-700 sticky bottom-0">
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={sessionStatus === 'idle' ? T.askMurshad : '...'}
                disabled={sessionStatus !== 'idle' || isSending}
                className={`w-full h-12 bg-gray-700 text-white rounded-full px-5 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 ${language === 'ur' ? 'font-urdu text-right' : ''}`}
            />
            {inputText.trim() && !isSending ? (
                <button type="submit" className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-teal-500 hover:bg-teal-600 transition-colors shrink-0">
                    <SendIcon className="w-6 h-6" />
                </button>
            ) : isSending ? (
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
            ) : (
                <MicButton />
            )}
        </form>
         {sessionStatus === 'error' && <p className="text-red-400 text-xs text-center mt-1">Connection failed. Please try again.</p>}
      </footer>
    </div>
  );
};

export default MurshadChat;