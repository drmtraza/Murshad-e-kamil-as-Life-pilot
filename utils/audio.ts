import type { Blob } from '@google/genai';

// --- Audio Encoding & Decoding ---
// These functions are critical for handling the raw audio data streams
// to and from the Gemini API.

/**
 * Decodes a base64 string into a Uint8Array.
 * The Gemini API sends audio data as a base64 string.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array into a base64 string.
 * This is used to send microphone audio data to the Gemini API.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that the browser can play.
 * The browser's native `decodeAudioData` is for file formats like MP3/WAV, not raw streams.
 * @param data The raw audio bytes from the API.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (Gemini uses 24000 Hz for output).
 * @param numChannels The number of audio channels (Gemini uses 1, mono).
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit integer to floating point value between -1.0 and 1.0
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


/**
 * Creates a Gemini Blob object from raw microphone audio data.
 * @param data The Float32Array of audio data from the ScriptProcessorNode.
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  // Convert float audio data to 16-bit integer
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    // The Gemini Live API requires this specific MIME type for audio input.
    mimeType: 'audio/pcm;rate=16000',
  };
}
