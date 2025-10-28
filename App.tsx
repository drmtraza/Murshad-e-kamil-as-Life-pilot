import React, { useState, useEffect, useCallback } from 'react';
import type { AssessmentAnswers, ChatMessage, HarmonyData, HistoryLog, Language } from './types';
import { Language as LanguageEnum, Pillar } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import MurshadChat from './components/MurshadChat';
import History from './components/History';
import { UI_TEXT } from './constants';
import { DashboardIcon, ChatIcon, HistoryIcon } from './components/icons';

type View = 'WELCOME' | 'ONBOARDING' | 'DASHBOARD' | 'CHAT' | 'HISTORY';

// --- MOCK API SERVICE ---
// In a real application, this would be in a separate `services/api.ts` file.
const SUKOON_MEDITATION_ACTION = {
  actionId: "A101",
  pillar: Pillar.Heart,
  text_en: "Practice Sukoon Meditation for 10 minutes before a challenging conversation.",
  text_ur: "کسی مشکل گفتگو سے پہلے 10 منٹ کے لیے سکون کی مراقبہ کریں۔",
  guidelines_en: "Find a quiet, comfortable space.\n1. **Settle In:** Sit or lie down with your back straight but relaxed. Close your eyes gently.\n2. **Breathe:** Take a few deep breaths. Inhale slowly through your nose, and exhale slowly through your mouth.\n3. **Focus:** Pay attention to the sensation of your breath. Notice the air entering and leaving your body.\n4. **Acknowledge Thoughts:** Your mind will wander. When it does, gently acknowledge the thought without judgment and guide your focus back to your breath.\n5. **Continue:** Do this for 10 minutes. Let peace settle over you.",
  guidelines_ur: "ایک پرسکون، آرام دہ جگہ تلاش کریں۔\n۱۔ **سکون سے بیٹھیں:** اپنی کمر سیدھی لیکن پرسکون رکھتے ہوئے بیٹھیں یا لیٹ جائیں۔ آہستہ سے اپنی آنکھیں بند کریں۔\n۲۔ **سانس لیں:** چند گہری سانسیں لیں۔ آہستہ آہستہ اپنی ناک سے سانس اندر لیں، اور آہستہ آہستہ اپنے منہ سے باہر نکالیں۔\n۳۔ **توجہ مرکوز کریں:** اپنی سانس کے احساس پر توجہ دیں۔ اپنے جسم میں ہوا کے داخل ہونے اور نکلنے کو محسوس کریں۔\n۴۔ **خیالات کو قبول کریں:** آپ کا ذہن بھٹکے گا۔ جب ایسا ہو، تو بغیر کسی فیصلے کے اس خیال کو نرمی سے قبول کریں اور اپنی توجہ واپس اپنی سانس پر لائیں۔\n۵۔ **جاری رکھیں:** یہ 10 منٹ تک کریں۔ سکون کو اپنے اوپر چھا جانے دیں۔",
  isCompleted: false,
  targetDate: new Date().toISOString(),
};


const mockApi = {
  getHarmonyData: async (): Promise<HarmonyData> => {
    console.log("API: GET /user/harmony");
    await new Promise(res => setTimeout(res, 500));
    // Check local storage for saved data
    const saved = localStorage.getItem('lifePilotData');
    if(saved) return JSON.parse(saved);
    
    // Default data if nothing is saved (user just finished onboarding)
    const initialScores = { mind: 70, body: 75, heart: 60, soul: 80 };
    const pilotScore = Math.round(Object.values(initialScores).reduce((a, b) => a + b, 0) / 4);
    
    return {
      pilotScore,
      scores: initialScores,
      currentAction: SUKOON_MEDITATION_ACTION,
    };
  },
  submitAssessment: async (answers: AssessmentAnswers): Promise<void> => {
    console.log("API: POST /user/assessment/initial", answers);
    // Calculate score based on answers (50 pts per 'yes' for its pillar)
    const scores = { mind: 0, body: 0, heart: 0, soul: 0 };
    Object.keys(answers).forEach(key => {
        if(answers[key]) {
            if(key.includes('mind')) scores.mind += 50;
            if(key.includes('body')) scores.body += 50;
            if(key.includes('heart')) scores.heart += 50;
            if(key.includes('soul')) scores.soul += 50;
        }
    });
    
    const pilotScore = Math.round(Object.values(scores).reduce((a,b) => a + b, 0) / 4);

    const initialData: HarmonyData = {
        pilotScore,
        scores,
        currentAction: SUKOON_MEDITATION_ACTION
    };
    localStorage.setItem('lifePilotData', JSON.stringify(initialData));
    localStorage.setItem('isInitialAssessmentComplete', 'true');
    await new Promise(res => setTimeout(res, 1000));
  },
  completeDailyAction: async (actionId: string, energyRating: number): Promise<HarmonyData> => {
    console.log("API: POST /actions/complete", { actionId, energyRating });
    const currentData = JSON.parse(localStorage.getItem('lifePilotData') || '{}') as HarmonyData;
    currentData.currentAction.isCompleted = true;
    currentData.scores[currentData.currentAction.pillar] = Math.min(100, currentData.scores[currentData.currentAction.pillar] + 20);
    currentData.pilotScore = Math.round(Object.values(currentData.scores).reduce((a, b) => a + b, 0) / 4);

    localStorage.setItem('lifePilotData', JSON.stringify(currentData));
    const history = JSON.parse(localStorage.getItem('lifePilotHistory') || '[]') as HistoryLog[];
    history.unshift({type: 'action', actionText: currentData.currentAction.text_en, completed: true, timestamp: new Date().toISOString()});
    localStorage.setItem('lifePilotHistory', JSON.stringify(history.slice(0, 7)));

    await new Promise(res => setTimeout(res, 500));
    return currentData;
  },
  getHistory: async (): Promise<HistoryLog[]> => {
    console.log("API: GET /user/history?limit=7");
    await new Promise(res => setTimeout(res, 500));
    return JSON.parse(localStorage.getItem('lifePilotHistory') || '[]');
  },
  logMurshadSession: (userMessage: string): void => {
      if(!userMessage) return;
      console.log("API: Logging Murshad session snippet.");
      const history = JSON.parse(localStorage.getItem('lifePilotHistory') || '[]') as HistoryLog[];
      history.unshift({type: 'session', snippet: userMessage.substring(0, 50) + '...', timestamp: new Date().toISOString()});
      localStorage.setItem('lifePilotHistory', JSON.stringify(history.slice(0, 7)));
  }
};
// --- END MOCK API ---

const App: React.FC = () => {
    const [view, setView] = useState<View>('DASHBOARD');
    const [language, setLanguage] = useState<LanguageEnum>(LanguageEnum.English);
    const [harmonyData, setHarmonyData] = useState<HarmonyData | null>(null);
    const [history, setHistory] = useState<HistoryLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const isComplete = localStorage.getItem('isInitialAssessmentComplete') === 'true';
        if (isComplete) {
            const data = await mockApi.getHarmonyData();
            setHarmonyData(data);
            setView('DASHBOARD');
        } else {
            setView('WELCOME');
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOnboardingComplete = async (answers: AssessmentAnswers) => {
        setIsLoading(true);
        await mockApi.submitAssessment(answers);
        await fetchData();
    };
    
    const handleActionComplete = async (actionId: string, energyRating: number) => {
        if(!harmonyData) return;
        setIsLoading(true);
        const updatedData = await mockApi.completeDailyAction(actionId, energyRating);
        setHarmonyData(updatedData);
        setIsLoading(false);
    };

    const navigate = async (newView: View) => {
        if (newView === view) return;
        
        setIsLoading(true);
        if (newView === 'HISTORY') {
            const historyData = await mockApi.getHistory();
            setHistory(historyData);
        }
         if (newView === 'DASHBOARD' && harmonyData?.currentAction.isCompleted) {
             const data = await mockApi.getHarmonyData();
             setHarmonyData(data);
        }
        setView(newView);
        setIsLoading(false);
    };
    
    const toggleLanguage = () => {
        setLanguage(prev => prev === LanguageEnum.English ? LanguageEnum.Urdu : LanguageEnum.English);
    }
    
    const renderView = () => {
        if (isLoading) {
            return (
                <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                    <svg className="animate-spin h-10 w-10 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="mt-4 text-lg font-semibold text-teal-400">{UI_TEXT[language].loading}</div>
                </div>
            );
        }
        
        const T = UI_TEXT[language];
        switch (view) {
            case 'WELCOME':
                return (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-900 p-4 text-center animate-fadeIn">
                        <h1 className={`text-5xl font-bold text-teal-400 ${language === 'ur' ? 'font-urdu' : ''}`}>{T.welcome}</h1>
                        <button 
                            onClick={() => setView('ONBOARDING')}
                            className={`mt-8 bg-teal-500 text-white font-bold py-3 px-8 rounded-full text-xl hover:bg-teal-600 transition-transform transform hover:scale-105 ${language === 'ur' ? 'font-urdu' : ''}`}
                        >
                            {T.startAssessment}
                        </button>
                    </div>
                );
            case 'ONBOARDING':
                return <Onboarding onComplete={handleOnboardingComplete} language={language} />;
            case 'DASHBOARD':
                return harmonyData ? <Dashboard harmonyData={harmonyData} language={language} onActionComplete={handleActionComplete} /> : null;
            case 'CHAT':
                return <MurshadChat initialHistory={[]} language={language} onBack={() => navigate('DASHBOARD')} onSessionLog={mockApi.logMurshadSession} />;
            case 'HISTORY':
                return <History history={history} language={language} onBack={() => navigate('DASHBOARD')} />;
            default:
                return null;
        }
    };
    
    const NavItem = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-teal-400' : 'text-gray-400 hover:text-white'}`}>
            {icon}
            <span className={`text-xs mt-1 ${language === 'ur' ? 'font-urdu' : ''}`}>{label}</span>
        </button>
    );

    const showNav = !isLoading && ['DASHBOARD', 'CHAT', 'HISTORY'].includes(view);

    return (
      <div className="h-screen w-screen bg-gray-900 text-white flex flex-col font-sans">
          <header className="flex-shrink-0 flex justify-between items-center p-4 bg-gray-800/80 backdrop-blur-sm shadow-md z-20">
              <h1 className="text-lg font-bold text-teal-400">Life Pilot AI</h1>
              <button 
                  onClick={toggleLanguage} 
                  className="bg-gray-700 text-white font-semibold py-1 px-3 rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                  {language === LanguageEnum.English ? 'اردو' : 'English'}
              </button>
          </header>
          
          <main className="flex-1 overflow-y-auto relative">
              {renderView()}
          </main>

          {showNav && (
            <footer className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm shadow-inner z-20">
                <nav className="flex justify-around items-center h-16 max-w-lg mx-auto">
                    <NavItem label={UI_TEXT[language].pilotScore} icon={<DashboardIcon className="w-6 h-6" />} isActive={view === 'DASHBOARD'} onClick={() => navigate('DASHBOARD')} />
                    <NavItem label={UI_TEXT[language].murshadSession} icon={<ChatIcon className="w-6 h-6" />} isActive={view === 'CHAT'} onClick={() => navigate('CHAT')} />
                    <NavItem label={UI_TEXT[language].history} icon={<HistoryIcon className="w-6 h-6" />} isActive={view === 'HISTORY'} onClick={() => navigate('HISTORY')} />
                </nav>
            </footer>
          )}
      </div>
    );
};

export default App;
