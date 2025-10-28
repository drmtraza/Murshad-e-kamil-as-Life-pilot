import React, { useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
// Fix: Import Pillar as a value since it is an enum used as a prop.
import { Pillar } from '../types';
import type { HarmonyData, Language } from '../types';
import { UI_TEXT } from '../constants';
import { MindIcon, BodyIcon, HeartIcon, SoulIcon, CheckCircleIcon } from './icons';

interface DashboardProps {
  harmonyData: HarmonyData;
  language: Language;
  onActionComplete: (actionId: string, energyRating: number) => void;
}

const PillarCard: React.FC<{ pillar: Pillar; score: number; language: Language }> = ({ pillar, score, language }) => {
    const T = UI_TEXT[language];
    const pillarConfig = {
        mind: { color: 'blue', Icon: MindIcon, name: T.mind },
        body: { color: 'green', Icon: BodyIcon, name: T.body },
        heart: { color: 'rose', Icon: HeartIcon, name: T.heart },
        soul: { color: 'purple', Icon: SoulIcon, name: T.soul },
    };
    const { color, Icon, name } = pillarConfig[pillar];
    
    return (
        <div className={`bg-gray-800 p-4 rounded-xl flex flex-col items-center justify-between shadow-lg border-t-4 border-${color}-500`}>
             <div className="flex items-center gap-2">
                <Icon className={`w-6 h-6 text-${color}-400`} />
                <h3 className={`text-lg font-semibold text-gray-200 ${language === 'ur' ? 'font-urdu' : ''}`}>{name}</h3>
            </div>
            <div className="text-4xl font-bold text-white mt-2">{score}</div>
             <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                <div className={`bg-${color}-500 h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );
};

const EnergyCheckinModal: React.FC<{
    language: Language,
    onConfirm: (rating: number) => void,
    onClose: () => void
}> = ({ language, onConfirm, onClose }) => {
    const T = UI_TEXT[language];
    const [rating, setRating] = useState(3);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm m-4 shadow-2xl">
                <h2 className={`text-2xl font-bold text-center text-teal-400 ${language === 'ur' ? 'font-urdu' : ''}`}>{T.energyCheckinTitle}</h2>
                <p className={`text-gray-300 text-center mt-2 mb-6 ${language === 'ur' ? 'font-urdu' : ''}`}>{T.energyCheckinPrompt}</p>
                
                <div className="flex flex-col items-center">
                    <div className="text-5xl font-bold text-white mb-4">{rating}</div>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className={`w-full flex justify-between text-xs text-gray-400 mt-2 ${language === 'ur' ? 'font-urdu flex-row-reverse' : ''}`}>
                        <span>{T.energyRating1}</span>
                        <span>{T.energyRating5}</span>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button onClick={onClose} className="w-full py-3 rounded-lg bg-gray-600 hover:bg-gray-700 font-semibold transition-colors">{T.back}</button>
                    <button onClick={() => onConfirm(rating)} className="w-full py-3 rounded-lg bg-teal-500 hover:bg-teal-600 font-semibold transition-colors">{T.confirm}</button>
                </div>
            </div>
        </div>
    )
}


const Dashboard: React.FC<DashboardProps> = ({ harmonyData, language, onActionComplete }) => {
  const { pilotScore, scores, currentAction } = harmonyData;
  const T = UI_TEXT[language];
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const chartData = [
    { pillar: T.mind, score: scores.mind },
    { pillar: T.body, score: scores.body },
    { pillar: T.heart, score: scores.heart },
    { pillar: T.soul, score: scores.soul },
  ];
  
  const handleCompleteClick = () => {
    if(!currentAction.isCompleted) {
        setShowEnergyModal(true);
    }
  }

  const handleEnergyConfirm = (rating: number) => {
    onActionComplete(currentAction.actionId, rating);
    setShowEnergyModal(false);
  }

  const guidelines = currentAction[language === 'en' ? 'guidelines_en' : 'guidelines_ur'];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      {showEnergyModal && <EnergyCheckinModal language={language} onConfirm={handleEnergyConfirm} onClose={() => setShowEnergyModal(false)} />}
      
      {/* Pilot Score */}
      <div className="text-center">
        <div className="relative inline-block">
            <svg className="w-48 h-48" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#374151" strokeWidth="12" />
                <circle 
                    cx="60" cy="60" r="54" fill="none" stroke="#2dd4bf" strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - pilotScore / 100)}
                    transform="rotate(-90 60 60)"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-gray-400 text-sm ${language === 'ur' ? 'font-urdu' : ''}`}>{T.pilotScore}</span>
                <span className="text-5xl font-bold">{pilotScore !== null ? pilotScore : '?'}</span>
            </div>
        </div>
        {pilotScore === null && (
            <p className={`mt-2 text-yellow-400 ${language === 'ur' ? 'font-urdu' : ''}`}>{T.recalibrationNeeded}</p>
        )}
      </div>

      {/* Pillar Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PillarCard pillar={Pillar.Mind} score={scores.mind} language={language}/>
          <PillarCard pillar={Pillar.Body} score={scores.body} language={language}/>
          <PillarCard pillar={Pillar.Heart} score={scores.heart} language={language}/>
          <PillarCard pillar={Pillar.Soul} score={scores.soul} language={language}/>
      </div>
      
      {/* Daily Action */}
      <div className="bg-gray-800 p-5 rounded-xl shadow-lg">
        <h2 className={`text-xl font-bold text-teal-400 ${language === 'ur' ? 'font-urdu' : ''}`}>{T.dailyAction}</h2>
        <p className={`mt-2 text-gray-300 leading-relaxed ${language === 'ur' ? 'font-urdu text-right text-lg' : 'text-base'}`}>
            {currentAction[language === 'en' ? 'text_en' : 'text_ur']}
        </p>
        
        {guidelines && (
            <div className="mt-3">
                <button
                    onClick={() => setShowGuidelines(!showGuidelines)}
                    className={`text-sm font-semibold text-teal-400 hover:text-teal-300 ${language === 'ur' ? 'float-right' : ''}`}
                >
                    {showGuidelines ? T.hideGuide : T.viewGuide}
                </button>
            </div>
        )}

        {showGuidelines && guidelines && (
             <div className={`mt-4 text-gray-400 bg-gray-900 p-4 rounded-lg animate-fadeIn text-sm ${language === 'ur' ? 'font-urdu text-right' : ''}`} style={{clear: 'both'}}>
                {guidelines.split('\n').map((line, index) => (
                    <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/۱۔|۲۔|۳۔|۴۔|۵۔/g, (match) => `<strong class="text-teal-400">${match}</strong>`).replace(/\d\./g, (match) => `<strong class="text-teal-400">${match}</strong>`) }} />
                ))}
            </div>
        )}

        <button 
            onClick={handleCompleteClick}
            disabled={currentAction.isCompleted}
            className={`mt-4 w-full h-12 flex items-center justify-center text-lg font-bold rounded-lg transition-all duration-300 ${
                currentAction.isCompleted
                ? 'bg-green-600 cursor-default'
                : 'bg-teal-500 hover:bg-teal-600'
            }`}
        >
            {currentAction.isCompleted ? (
                <>
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    <span className={language === 'ur' ? 'font-urdu' : ''}>{T.completed}</span>
                </>
            ) : (
                <span className={language === 'ur' ? 'font-urdu' : ''}>{T.completeAction}</span>
            )}
        </button>
      </div>

    </div>
  );
};

export default Dashboard;