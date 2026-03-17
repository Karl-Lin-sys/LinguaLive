import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AudioRecorder, AudioStreamPlayer } from '../lib/audioUtils';

export type TranscriptEntry = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isFinal: boolean;
};

export function useLiveAPI() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioStreamPlayer | null>(null);

  const connect = useCallback(async (language: string, scenario: string, voice: string) => {
    setConnecting(true);
    setError(null);
    setTranscripts([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      playerRef.current = new AudioStreamPlayer(24000);

      const systemInstruction = `You are a helpful language learning partner. The user is practicing ${language}. The scenario is: ${scenario}. Speak exclusively in ${language} unless asked for a translation. Keep your responses concise, natural, and conversational. Correct the user gently if they make major mistakes, but prioritize keeping the conversation flowing.`;

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
            setConnecting(false);
            recorderRef.current = new AudioRecorder(stream, (base64) => {
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            });
          },
          onmessage: (message: LiveServerMessage) => {
            // Handle audio output
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && playerRef.current) {
              playerRef.current.addPCM16(audioData);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              if (playerRef.current) {
                playerRef.current.stop();
                playerRef.current = new AudioStreamPlayer(24000); // reset player
              }
            }

            // Handle output transcription (AI)
            const modelTurnParts = message.serverContent?.modelTurn?.parts;
            if (modelTurnParts) {
              const textParts = modelTurnParts.filter(p => p.text).map(p => p.text).join('');
              if (textParts) {
                setTranscripts(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'ai' && !last.isFinal) {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...last, text: last.text + textParts };
                    return updated;
                  } else {
                    return [...prev, { id: Date.now().toString(), role: 'ai', text: textParts, isFinal: false }];
                  }
                });
              }
            }
            
            // Mark AI turn as final when turn is complete
            if (message.serverContent?.turnComplete) {
              setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'ai') {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...last, isFinal: true };
                  return updated;
                }
                return prev;
              });
            }

            // Handle input transcription (User)
            // Note: The structure of input transcription might vary slightly, but usually it's in clientContent or similar.
            // We will just catch any text that comes back that isn't modelTurn if possible, or rely on the SDK's transcription format.
            // For now, we'll focus on the audio interaction.
          },
          onclose: () => {
            disconnect();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Failed to connect", err);
      setError(err.message || "Failed to access microphone or connect to API.");
      setConnecting(false);
      disconnect();
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setConnecting(false);
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => {
        try { s.close(); } catch(e) {}
      });
      sessionRef.current = null;
    }
  }, []);

  return { connected, connecting, connect, disconnect, transcripts, error };
}
