
import React, { useState } from 'react';
import type { AssessmentAnswers, Language } from '../types';
import { ASSESSMENT_QUESTIONS, UI_TEXT } from '../constants';

interface OnboardingProps {
  onComplete: (answers: AssessmentAnswers) => Promise<void>;
  language: Language;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const T = UI_TEXT[language];

  const handleAnswer = (questionId: string, answer: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const isComplete = Object.keys(answers).length === ASSESSMENT_QUESTIONS.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isComplete && !isSubmitting) {
      setIsSubmitting(true);
      await onComplete(answers);
      // No need to set isSubmitting back to false, as the component will unmount.
    }
  };
  
  const pillarColors: { [key: string]: string } = {
      soul: 'border-purple-500',
      heart: 'border-rose-500',
      mind: 'border-blue-500',
      body: 'border-green-500',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center justify-center animate-fadeIn">
      <div className="w-full max-w-2xl text-center">
        <h1 className={`text-4xl font-bold text-teal-400 ${language === 'ur' ? 'font-urdu' : ''}`}>{T.onboardingTitle}</h1>
        <p className={`mt-2 text-gray-300 ${language === 'ur' ? 'font-urdu' : ''}`}>{T.onboardingSubtitle}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mt-8 space-y-6">
        {ASSESSMENT_QUESTIONS.map((q, index) => (
          <div key={q.id} className={`bg-gray-800 p-6 rounded-lg border-l-4 ${pillarColors[q.pillar]} shadow-lg`}>
            <p className={`text-lg text-gray-200 ${language === 'ur' ? 'font-urdu text-right' : ''}`}>
              {`${index + 1}. ${q[language === 'en' ? 'text_en' : 'text_ur']}`}
            </p>
            <div className={`mt-4 flex gap-4 ${language === 'ur' ? 'justify-end' : 'justify-start'}`}>
              <button
                type="button"
                onClick={() => handleAnswer(q.id, true)}
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-all duration-300 w-28 h-12 ${answers[q.id] === true ? 'bg-green-500 text-white scale-105' : 'bg-gray-700 hover:bg-green-600'}`}
              >
                {T.yes}
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(q.id, false)}
                className={`px-6 py-2 rounded-full text-lg font-semibold transition-all duration-300 w-28 h-12 ${answers[q.id] === false ? 'bg-red-500 text-white scale-105' : 'bg-gray-700 hover:bg-red-600'}`}
              >
                {T.no}
              </button>
            </div>
          </div>
        ))}

        <div className="pt-4">
          <button
            type="submit"
            disabled={!isComplete || isSubmitting}
            className={`w-full h-14 text-xl font-bold rounded-lg transition-all duration-300 flex items-center justify-center ${
                !isComplete || isSubmitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {isSubmitting ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {T.loading}
                </>
            ) : (
                T.submit
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Onboarding;
