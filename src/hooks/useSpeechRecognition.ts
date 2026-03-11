import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Minimal type declarations for the Web Speech API ────────────────────────
// These are not guaranteed to be present in every TS DOM lib version, so we
// declare them ourselves to avoid CI build failures.

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart:  ((e: Event) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:    ((e: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

// ─── Resolve vendor-prefixed constructor once ─────────────────────────────────

const SR: SpeechRecognitionCtor | undefined =
  typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition as SpeechRecognitionCtor | undefined) ??
      ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionCtor | undefined)
    : undefined;

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseSpeechReturn {
  isListening: boolean;
  transcript: string;
  supported: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(
  onResult: (transcript: string) => void,
): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [error, setError]             = useState<string | null>(null);
  const recRef                        = useRef<ISpeechRecognition | null>(null);

  // Stable ref so the recognition callback always uses the latest handler
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const start = useCallback(() => {
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous       = false;
      rec.interimResults   = true;
      rec.lang             = 'en-US';
      rec.maxAlternatives  = 1;

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
        setError(null);
      };

      rec.onresult = (e: SpeechRecognitionEvent) => {
        const full = Array.from({ length: e.results.length })
          .map((_, i) => e.results[i][0].transcript)
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

  const stop  = useCallback(() => recRef.current?.stop(),  []);
  const reset = useCallback(() => { setTranscript(''); setError(null); }, []);

  useEffect(() => () => { recRef.current?.abort(); }, []);

  return { isListening, transcript, supported: !!SR, error, start, stop, reset };
}
