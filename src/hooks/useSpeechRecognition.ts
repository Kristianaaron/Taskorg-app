import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseSpeechReturn {
  isListening: boolean;
  transcript: string;
  supported: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// Grab the vendor-prefixed constructor once at module load
const SR: (new () => SpeechRecognition) | undefined =
  typeof window !== 'undefined'
    ? window.SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
        .webkitSpeechRecognition
    : undefined;

export function useSpeechRecognition(
  onResult: (transcript: string) => void,
): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  // Keep a stable ref so the recognition callback always calls the latest handler
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const start = useCallback(() => {
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setError(null);
      };

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const full = Array.from(e.results)
          .map(r => r[0].transcript)
          .join('');
        setTranscript(full);
        if (e.results[e.results.length - 1].isFinal) {
          onResultRef.current(full.toLowerCase().trim());
        }
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        setError(e.error);
        setIsListening(false);
      };

      rec.onend = () => setIsListening(false);

      recRef.current = rec;
      rec.start();
    } catch {
      // Guard against "already started" or permission errors
    }
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Abort recognition on unmount
  useEffect(() => () => { recRef.current?.abort(); }, []);

  return { isListening, transcript, supported: !!SR, error, start, stop, reset };
}
