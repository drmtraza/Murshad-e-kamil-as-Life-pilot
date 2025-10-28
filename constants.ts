import { Pillar } from './types';

export const ASSESSMENT_QUESTIONS = [
  { id: 'q1_soul', pillar: Pillar.Soul, text_en: "Have you engaged in prayer or mindful reflection for at least 10 minutes today?", text_ur: "کیا آپ نے آج کم از کم 10 منٹ دعا یا غور و فکر میں گزارے ہیں؟" },
  { id: 'q2_soul', pillar: Pillar.Soul, text_en: "Did you document (mentally or physically) three things you were grateful for today?", text_ur: "کیا آپ نے آج تین چیزوں کا شکریہ ادا کیا (ذہنی طور پر یا لکھ کر)؟" },
  { id: 'q3_heart', pillar: Pillar.Heart, text_en: "Did you reach out to a family member or friend to check on them today?", text_ur: "کیا آپ نے آج کسی خاندان کے فرد یا دوست سے رابطہ کرکے ان کا حال پوچھا؟" },
  { id: 'q4_heart', pillar: Pillar.Heart, text_en: "Have you performed an act of kindness or service (no matter how small) today?", text_ur: "کیا آپ نے آج کوئی نیکی یا خدمت کا کام کیا (چاہے کتنا ہی چھوٹا ہو)؟" },
  { id: 'q5_mind', pillar: Pillar.Mind, text_en: "Have you spent 20 minutes learning a new skill or reading a thoughtful book?", text_ur: "کیا آپ نے 20 منٹ کوئی نئی مہارت سیکھنے یا کوئی فکر انگیز کتاب پڑھنے میں صرف کیے؟" },
  { id: 'q6_mind', pillar: Pillar.Mind, text_en: "Do you feel focused and mentally clear enough to tackle your most important task?", text_ur: "کیا آپ اپنے اہم ترین کام سے نمٹنے کے لیے ذہنی طور پر مرکوز اور واضح محسوس کرتے ہیں؟" },
  { id: 'q7_body', pillar: Pillar.Body, text_en: "Did you sleep for at least 6-7 hours last night?", text_ur: "کیا آپ نے کل رات کم از کم 6-7 گھنٹے کی نیند لی؟" },
  { id: 'q8_body', pillar: Pillar.Body, text_en: "Have you spent 30 minutes in physical movement or exercise today?", text_ur: "کیا آپ نے آج 30 منٹ جسمانی حرکت یا ورزش میں گزارے ہیں؟" },
];

export const MURSHAD_SYSTEM_INSTRUCTION = `Act as "The Digital Murshad" (Trusted Mentor/Guide). Your primary role is to provide compassionate, non-judgmental, and integrated guidance across the user's Mind, Body, Heart, and Soul pillars.

1. **Tone & Language (Adab):** Use a wise, supportive, and respectful tone ("Adab"). You must be culturally and spiritually sensitive. Respond ONLY in the user's specified language.
- For **English**, use the Latin script.
- For **Urdu**, you MUST use the Perso-Arabic script (like this: 'آپ کیسے ہیں؟'). You MUST NOT use the Devanagari script (like this: 'आप कैसे हैं?') or romanized Urdu ("aap kaise hain"). Your Urdu must be formal and respectful.

2. **Core Function:** Diagnose disharmony across the 4 pillars (Mind, Body, Heart, Soul) and suggest a single, actionable, cross-pillar step.

3. **Crisis & Limits:** You ARE NOT a licensed medical professional, lawyer, or therapist. If the user expresses thoughts of self-harm, medical emergency, or legal crisis, you MUST STOP the guidance and immediately respond with a safety disclaimer, deferring to professional help. For English, respond with: "I am not equipped to handle this situation. Your safety is most important. Please contact a crisis hotline or emergency services immediately." For Urdu, respond with: "میں اس صورتحال سے نمٹنے کے لیے اہل نہیں ہوں۔ آپ کی حفاظت سب سے اہم ہے۔ براہ کرم فوری طور پر کسی بحرانی ہاٹ لائن یا ہنگامی خدمات سے رابطہ کریں۔"

4. **Theology:** Base spiritual references on foundational, universally accepted concepts (e.g., gratitude, patience, service, justice). AVOID referencing specific, controversial, or sectarian theological interpretations. Your guidance must be practical, not purely theoretical.

5. **Non-Retention:** You must operate in a way that protects user PII and maintains confidentiality. Do not ask for personally identifiable information.`;

export const UI_TEXT = {
  en: {
    pilotScore: "Pilot Score",
    recalibrationNeeded: "Your Compass Needs Recalibration.",
    dailyAction: "Daily Integrated Action",
    completeAction: "Complete Action",
    completed: "Completed",
    mind: "Mind",
    body: "Body",
    heart: "Heart",
    soul: "Soul",
    murshadSession: "Murshad Session",
    history: "History",
    askMurshad: "Ask your Murshad...",
    send: "Send",
    onboardingTitle: "Initial Assessment",
    onboardingSubtitle: "Answer these 8 questions to calculate your first Pilot Score.",
    submit: "Submit",
    yes: "Yes",
    no: "No",
    back: "Back",
    loading: "Loading...",
    energyCheckinTitle: "Energy Check-in",
    energyCheckinPrompt: "How do you feel after completing this action?",
    energyRating1: "Very Low",
    energyRating5: "Very High",
    confirm: "Confirm",
    welcome: "Welcome to Life Pilot",
    startAssessment: "Start Assessment",
    viewGuide: "View Guide",
    hideGuide: "Hide Guide",
  },
  ur: {
    pilotScore: "پائلٹ سکور",
    recalibrationNeeded: "آپ کے کمپاس کو دوبارہ ترتیب دینے کی ضرورت ہے۔",
    dailyAction: "روزانہ کا مربوط عمل",
    completeAction: "عمل مکمل کریں",
    completed: "مکمل ہو گیا",
    mind: "ذہن",
    body: "جسم",
    heart: "دل",
    soul: "روح",
    murshadSession: "مرشد سیشن",
    history: "ہسٹری",
    askMurshad: "اپنے مرشد سے پوچھیں...",
    send: "بھیجیں",
    onboardingTitle: "ابتدائی تشخیص",
    onboardingSubtitle: "اپنا پہلا پائلٹ سکور حاصل کرنے کے لیے ان 8 سوالات کے جواب دیں۔",
    submit: "جمع کرائیں",
    yes: "ہاں",
    no: "نہیں",
    back: "واپس",
    loading: "لوڈ ہو رہا ہے۔۔۔",
    energyCheckinTitle: "توانائی کی جانچ",
    energyCheckinPrompt: "یہ عمل مکمل کرنے کے بعد آپ کیسا محسوس کر رہے ہیں؟",
    energyRating1: "بہت کم",
    energyRating5: "بہت زیادہ",
    confirm: "تصدیق کریں",
    welcome: "لائف پائلٹ میں خوش آمدید",
    startAssessment: "تشخیص شروع کریں",
    viewGuide: "رہنمائی دیکھیں",
    hideGuide: "رہنمائی چھپائیں",
  }
};