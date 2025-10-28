import { GoogleGenAI, Modality } from "@google/genai";
// FIX: Remove ErrorEvent from type-only import to use the global ErrorEvent which is a value.
import type { LiveSession, LiveServerMessage, CloseEvent, Content } from "@google/genai";
import { MURSHAD_SYSTEM_INSTRUCTION } from '../constants';
import { Language, ChatMessage } from "../types";
import { createBlob } from "../utils/audio";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Callbacks interface for the live session, corrected to lowercase
interface LiveCallbacks {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}

// --- Text-based Chat Service ---
export const textService = {
    sendMessage: async (message: string, language: Language, history: ChatMessage[]): Promise<string> => {
        if (!API_KEY) {
            const errorMsg = "Error: API Key not configured.";
            console.error(errorMsg);
            return errorMsg;
        }
        try {
            const contents: Content[] = history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
            contents.push({ role: 'user', parts: [{ text: message }] });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents,
                config: {
                    systemInstruction: `${MURSHAD_SYSTEM_INSTRUCTION} \n IMPORTANT: You must respond in the user's language which is: ${language === Language.English ? 'English' : 'Urdu'}`,
                }
            });
            
            return response.text;
        } catch (error) {
            console.error("Failed to send message to Gemini:", error);
            return language === Language.English ? "Sorry, I encountered an error. Please try again." : "معذرت، ایک خرابی پیش آ گئی ہے۔ براہ کرم دوبارہ کوشش کریں۔";
        }
    }
};


// --- Real-time Voice Service ---
export const liveService = {
    connect: async (language: Language, callbacks: LiveCallbacks): Promise<LiveSession | null> => {
        if (!API_KEY) {
            console.error("Cannot connect to live service, API Key not configured.");
            callbacks.onerror(new ErrorEvent('error', { message: 'API Key not configured' }));
            return null;
        }

        try {
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks,
                config: {
                    responseModalities: [Modality.AUDIO],
                    // Enable transcriptions for both user input and model output
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: `${MURSHAD_SYSTEM_INSTRUCTION} \n IMPORTANT: You must respond in the user's language which is: ${language === Language.English ? 'English' : 'Urdu'}`,
                },
            });

            // Stream audio from the microphone to the model.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // FIX: Add type assertion to handle vendor-prefixed webkitAudioContext.
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                // Rely on the sessionPromise to resolve before sending data
                sessionPromise.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            // Store references to cleanup later
            const session = await sessionPromise;
            (session as any).stream = stream;
            (session as any).audioContext = inputAudioContext;
            (session as any).scriptProcessor = scriptProcessor;

            return session;

        } catch (error) {
            console.error("Failed to connect to Gemini Live service:", error);
            callbacks.onerror(new ErrorEvent('error', { message: 'Failed to connect' }));
            return null;
        }
    },
    
    close: (session: LiveSession | null) => {
        if (session) {
            // Stop microphone tracks
            (session as any).stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            // Disconnect script processor to stop processing audio
            (session as any).scriptProcessor?.disconnect();
            // Close audio context
            (session as any).audioContext?.close();
            // Close the connection to Gemini
            session.close();
        }
    }
};