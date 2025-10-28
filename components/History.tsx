
import React from 'react';
import type { HistoryLog, Language } from '../types';
import { UI_TEXT } from '../constants';
import { BackIcon, ChatIcon, CheckCircleIcon } from './icons';

interface HistoryProps {
    history: HistoryLog[];
    language: Language;
    onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ history, language, onBack }) => {
    const T = UI_TEXT[language];
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="h-full flex flex-col bg-gray-900 animate-fadeIn">
            <header className="bg-gray-800 p-4 flex items-center shadow-md sticky top-0 z-10">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    <BackIcon className="w-6 h-6 text-white" />
                </button>
                <h1 className={`text-xl font-bold text-teal-400 mx-auto ${language === 'ur' ? 'font-urdu' : ''}`}>{T.history}</h1>
                <div className="w-10"></div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 && (
                    <div className="text-center text-gray-400 mt-20">
                        <p>No history yet.</p>
                    </div>
                )}
                {history.map((item, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {item.type === 'session' ? (
                                <ChatIcon className="w-8 h-8 text-blue-400" />
                            ) : (
                                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-300 font-semibold">{item.type === 'session' ? T.murshadSession : T.dailyAction}</p>
                            <p className="text-gray-400">{item.snippet || item.actionText}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(item.timestamp)}</p>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
};

export default History;
