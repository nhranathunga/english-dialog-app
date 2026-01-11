import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useSpeechRecognition({ lang = "en-GB" } = {}) {
  const SpeechRecognition = useMemo(
    () => window.SpeechRecognition || window.webkitSpeechRecognition,
    []
  );

  const supported = !!SpeechRecognition;
  const recRef = useRef(null);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supported) return;

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setError("");
      setListening(true);
    };

    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript ?? "";
      setTranscript(t);
    };

    rec.onerror = (e) => setError(e?.error || "Speech recognition error");
    rec.onend = () => setListening(false);

    recRef.current = rec;

    return () => {
      rec.onstart = rec.onresult = rec.onerror = rec.onend = null;
      recRef.current = null;
    };
  }, [supported, SpeechRecognition, lang]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setTranscript("");
    setError("");
    recRef.current.start();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop?.();
  }, []);

  return { supported, listening, transcript, error, start, stop, setTranscript };
}
