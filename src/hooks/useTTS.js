import { useCallback, useEffect, useMemo, useState } from "react";

export function useTTS({ lang = "en-GB", googleApiKey = null } = {}) {
  const [voices, setVoices] = useState([]);
  const [rate, setRate] = useState(1.0);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices?.() ?? []);
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const voice = useMemo(() => {
    const uk = voices.find((v) => (v.lang || "").toLowerCase() === "en-gb");
    const anyEnglish = voices.find((v) => (v.name || "").toLowerCase().includes("english"));
    return uk || anyEnglish || null;
  }, [voices]);

  const speakGoogle = useCallback(async (text, apiKey) => {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "en-GB", name: "en-GB-Neural2-B" },
          audioConfig: { audioEncoding: "MP3", speakingRate: rate }
        })
      });
      
      const data = await response.json();
      if (!data.audioContent) throw new Error("No audio content");

      return new Promise((resolve) => {
        const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
        setCurrentAudio(audio);
        audio.onended = () => {
          setCurrentAudio(null);
          resolve(true);
        };
        audio.onerror = () => {
          setCurrentAudio(null);
          resolve(false);
        };
        audio.play();
      });

    } catch (e) {
      console.error("Google TTS failed", e);
      return false;
    }
  }, [rate]);

  const speakNative = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text) return resolve(false);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      if (voice) u.voice = voice;

      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      window.speechSynthesis.speak(u);
    });
  }, [lang, rate, voice]);

  const speak = useCallback(async (text) => {
    let success = false;
    if (googleApiKey) {
      success = await speakGoogle(text, googleApiKey);
    }
    
    // Fallback to native if Google failed or no key
    if (!success) {
      return speakNative(text);
    }
    return true;
  }, [googleApiKey, speakGoogle, speakNative]);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    window.speechSynthesis?.cancel?.();
  }, [currentAudio]);

  return { speak, stop, rate, setRate, voices, voice };
}
