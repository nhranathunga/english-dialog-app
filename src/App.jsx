import { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles.css";
import { scoreAttempt, buildFeedback } from "./utils/score";
import { useTTS } from "./hooks/useTTS";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

import SettingsBar from "./components/SettingsBar";
import DialogCard from "./components/DialogCard";
import Controls from "./components/Controls";
import Feedback from "./components/Feedback";

import AdminDashboard from "./components/AdminDashboard";

function getPair(turns, startIndex) {
  // Find nearest app line at or before startIndex
  let appIdx = startIndex;
  while (appIdx >= 0 && turns[appIdx]?.speaker !== "app") appIdx--;

  // Find next user line after appIdx
  let userIdx = appIdx + 1;
  while (userIdx < turns.length && turns[userIdx]?.speaker !== "user") userIdx++;

  return { appIdx, userIdx };
}

function GameInterface({ library, setLibrary }) {
  // Game Interface State
  const [navPath, setNavPath] = useState({ level: null, category: null, dialog: null, view: 'home' });

  // Practice Session State (only active when navPath.dialog is set)
  const [pack, setPack] = useState(null);
  const [mode, setMode] = useState("normal");
  
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem("googleApiKey") || "AIzaSyA9RXgG4YUoSJc1QNxsWOofJs_bBHiYSeg");
  const saveApiKey = (key) => {
    setGoogleApiKey(key);
    localStorage.setItem("googleApiKey", key);
  };

  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("isPremium") === "true");
  const togglePremium = () => {
    const newState = !isPremium;
    setIsPremium(newState);
    localStorage.setItem("isPremium", newState);
    if (!newState) setUseGoogleVoice(false); // Force off if premium lost
  };

  const [useGoogleVoice, setUseGoogleVoice] = useState(false);
  
  // Only allow Google Voice if Premium is active AND a key exists
  const effectiveKey = (isPremium && useGoogleVoice) ? googleApiKey : null;
  const { speak, rate, setRate, stop } = useTTS({ lang: "en-GB", googleApiKey: effectiveKey });
  const stt = useSpeechRecognition({ lang: "en-GB" });

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(null);
  const [resultLabel, setResultLabel] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [started, setStarted] = useState(false);

  // Initialize pack when dialog selected
  useEffect(() => {
    if (navPath.dialog) {
      setPack(navPath.dialog);
      setIndex(0);
      setStarted(false);
      // Intro played state is persistent across dialogs now
      setScore(null);
      setIsUserTurn(false);
    }
  }, [navPath.dialog]);

  const turns = pack?.turns || [];

  const { appIdx, userIdx } = useMemo(() => {
    if (!pack) return { appIdx: -1, userIdx: -1 };
    return getPair(turns, index);
  }, [turns, index, pack]);

  const appLine = turns[appIdx]?.text ?? "";
  const expectedLine = turns[userIdx]?.text ?? "";
  const keywords = turns[userIdx]?.keywords ?? [];

  // When app turn changes: reset UI and auto speak app line
  useEffect(() => {
    if (!started) return;

    setScore(null);
    setResultLabel(null);
    setFeedback(null);
    stt.setTranscript("");
    setIsUserTurn(false);

    const playRoutine = async () => {
      if (!introPlayed) {
        setIntroPlayed(true);
        // Play intro instructions
        await speak("Welcome. I will speak the first line. Then, please speak the response highlighted in blue.");
      }
      
      if (appLine) {
        await speak(appLine);
      }
      setIsUserTurn(true);
    };

    playRoutine();

    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIdx, started]);

  // Silence detection logic
  useEffect(() => {
    if (!isUserTurn || score || stt.transcript || !started) return;

    const timer = setTimeout(() => {
      speak("I haven't heard you. Please read the highlighted line loud and clear.");
    }, 8000);

    return () => clearTimeout(timer);
  }, [isUserTurn, score, stt.transcript, started, speak]);

  // When user transcript arrives: score it
  useEffect(() => {
    if (!stt.transcript || !expectedLine) return;

    const result = scoreAttempt(stt.transcript, expectedLine, keywords, mode);
    setScore(result.score);
    setResultLabel(result.pass ? "PASS ✅" : "TRY AGAIN");
    setFeedback(buildFeedback(stt.transcript, expectedLine, keywords, result));

    if (result.pass) {
      // Move to next app line after this user line
      let next = userIdx + 1;
      while (next < turns.length && turns[next].speaker !== "app") next++;

      if (next >= turns.length) {
        setResultLabel("COMPLETED 🎉");
        return;
      }
      setTimeout(() => setIndex(next), 700);
    } else {
      // Incorrect attempt: provide voice feedback
      stt.stop();
      speak("Incorrect. Please say: " + expectedLine).then(() => {
        // Reset state to allow retry (this will trigger auto-listen again)
        setScore(null);
        stt.setTranscript("");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stt.transcript]);

  // Auto-listen when it's user's turn
  useEffect(() => {
    if (isUserTurn && !stt.listening && !score) {
      // Small delay to ensure TTS is fully fully stopped and mic is ready
      const timer = setTimeout(() => {
         stt.start();
      }, 200);
      return () => clearTimeout(timer);
    } else if (!isUserTurn && stt.listening) {
      stt.stop();
    }
  }, [isUserTurn, stt.listening, score, stt]);

  const onSkip = () => {
    let next = userIdx + 1;
    while (next < turns.length && turns[next].speaker !== "app") next++;
    if (next < turns.length) setIndex(next);
  };

  // Navigation Handlers
  const selectLevel = (level) => setNavPath({ ...navPath, level, category: null, dialog: null });
  const selectCategory = (category) => setNavPath({ ...navPath, category, dialog: null });
  const selectDialog = (dialog) => setNavPath({ ...navPath, dialog });
  
  const handleNavBack = () => {
    if (navPath.category) {
      setNavPath({ ...navPath, category: null });
    } else if (navPath.level) {
      setNavPath({ ...navPath, level: null });
    }
  };

  const resetToHome = () => {
    // If we are in a practice session, confirm first (though user shouldn't be here ideally)
    if (pack && started) {
       if (!window.confirm("Quit session?")) return;
       stop(); stt.stop();
    }
    setNavPath({ level: null, category: null, dialog: null, view: 'home' });
    setPack(null);
    setStarted(false);
  };

  const handlePracticeExit = () => {
    if (started) {
      const confirmed = window.confirm("Are you sure you want to quit? Current session will be terminated.");
      if (!confirmed) return;
    }

    // Go back to Category listing (keep level and category)
    setNavPath({ ...navPath, dialog: null }); 
    setPack(null);
    
    // Reset Practice State
    setStarted(false);
    setIsUserTurn(false);
    setScore(null);
    // Intro state persists
    
    stop();      // Stop TTS
    stt.stop();  // Stop Microphone
  };
  
  const goToPackages = () => setNavPath({ ...navPath, view: 'packages' });

  const handlePurchase = () => {
    setIsPremium(true);
    localStorage.setItem("isPremium", "true");
    setUseGoogleVoice(true);
    // Return to previous view (Practice Mode or Navigation) instead of resetting entire app
    setNavPath({ ...navPath, view: 'home' });
  };

  // 1. Loading State (Handled by App, but safe here)
  if (!library) return <div className="wrap">Loading library...</div>;

  // 2. Packages View
  if (navPath.view === 'packages') {
    return (
      <div className="wrap">
        <div className="header-row">
          <button className="back-btn" onClick={() => setNavPath({ ...navPath, view: 'home' })}>← Back</button>
          <h1>Premium Packages</h1>
        </div>
        <div className="grid">
           <div className="tile premium-card" onClick={handlePurchase}>
             <h2 style={{color:'var(--warning)'}}>Monthly</h2>
             <p className="big">$4.99 / mo</p>
             <p>Unlock Natural Neural Voices</p>
           </div>
           <div className="tile premium-card" onClick={handlePurchase}>
             <h2 style={{color:'var(--warning)'}}>Yearly</h2>
             <p className="big">$39.99 / yr</p>
             <p>Save 30%</p>
           </div>
        </div>
      </div>
    );
  }

  // 3. Navigation Mode (No dialog selected)
  if (!pack) {
    return (
      <div className="wrap">
        <div className="header-row">
          {navPath.level ? (
            <button className="back-btn" onClick={handleNavBack}>← Back</button>
          ) : (
            <div style={{width:'50px'}}></div> // Spacer
          )}
          <h1 style={{flex:1, textAlign: 'center'}}>English Speaking Practice</h1>
          
          <div style={{display:'flex', gap:'10px'}}>
             {/* Admin or other header items could go here */}
          </div>
        </div>
        
        <div className="breadcrumbs">
          <span onClick={resetToHome} className="link" style={{fontSize: '20px'}}>🏠</span>
          {navPath.level && <span onClick={() => selectLevel(navPath.level)} className="link"> / {navPath.level.name}</span>}
          {navPath.category && <span> / {navPath.category.name}</span>}
        </div>

        <div className="grid" style={{ justifyContent: 'center' }}>
          {/* Level Selection */}
          {!navPath.level && library.levels.map(level => (
            <div key={level.id} className="tile level-tile" onClick={() => selectLevel(level)}>
              <h2>{level.id}</h2>
              <p>{level.name}</p>
            </div>
          ))}

          {/* Category Selection */}
          {navPath.level && !navPath.category && navPath.level.categories.map(cat => (
            <div key={cat.id} className="tile cat-tile" onClick={() => selectCategory(cat)}>
              <h3>{cat.name}</h3>
              <p>{cat.dialogs.length} Dialogs</p>
            </div>
          ))}

          {/* Dialog Selection */}
          {navPath.category && navPath.category.dialogs.map(dialog => (
            <div key={dialog.id} className="tile dialog-tile" onClick={() => selectDialog(dialog)}>
              <h3>{dialog.title}</h3>
              <p>{dialog.turns.length} turns</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Practice Mode
  return (
    <div className="wrap">
      <div className="header-row">
        <button className="back-btn" onClick={handlePracticeExit}>← Back</button>
        <h1 style={{flex:1, textAlign:'center'}}>Practice</h1>
        <button className="danger" onClick={handlePracticeExit} style={{fontSize:'12px', padding:'6px 12px'}}>Exit ⏹</button>
      </div>
      
      {!started && (
        <div className="start-overlay">
          <button className="start-btn" onClick={() => setStarted(true)}>
            Start Session ▶
          </button>
        </div>
      )}

      <div className={!started ? "blur-content" : ""}>
        <SettingsBar 
          mode={mode} 
          setMode={setMode} 
          rate={rate} 
          setRate={setRate}
          isPremium={isPremium}
          onBuyPremium={goToPackages}
          useGoogle={useGoogleVoice}
          setUseGoogle={setUseGoogleVoice}
        />

        {!stt.supported ? (
          <div className="card bad">
            Speech recognition isn’t supported in this browser. Use Chrome/Edge.
          </div>
        ) : null}

        <DialogCard
          title={pack.title}
          level={pack.level || navPath.level?.id || "A1"}
          appLine={appLine}
          expectedLine={expectedLine}
          isUserTurn={isUserTurn}
        />

        <Controls
          canSpeak={!!appLine || !!expectedLine}
          canListen={stt.supported && !!expectedLine}
          listening={stt.listening}
          onSpeakApp={() => speak(appLine)}
          onListenExpected={() => speak(expectedLine)}
          onStart={stt.start}
          onStop={stt.stop}
          onSkip={onSkip}
        />

        <Feedback
          transcript={stt.transcript}
          score={score}
          resultLabel={resultLabel}
          feedback={feedback}
        />

        {stt.error ? <div className="card bad">STT Error: {stt.error}</div> : null}
      </div>
    </div>
  );
}

export default function App() {
  const [library, setLibrary] = useState(null);
  
  // Load Library
  useEffect(() => {
    const customLib = localStorage.getItem("customLibrary");
    if (customLib) {
      try {
        setLibrary(JSON.parse(customLib));
        return;
      } catch (e) {
        console.error("Failed to parse custom library", e);
      }
    }

    // Try fetching from backend API first
    fetch("http://localhost:5000/api/content/library")
      .then(res => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then(data => {
        console.log("Loaded library from API");
        setLibrary(data);
      })
      .catch(err => {
        console.warn("API failed, falling back to static file", err);
        // Fallback to local file if backend is down
        fetch("/dialogs.json")
          .then(res => res.json())
          .then(data => setLibrary(data))
          .catch(e => console.error("Failed to load dialogs", e));
      });
  }, []);

  if (!library) return <div className="wrap">Loading...</div>;

  return (
    <Routes>
      <Route path="/*" element={<GameInterface library={library} setLibrary={setLibrary} />} />
      <Route path="/admin" element={<AdminDashboard library={library} setLibrary={setLibrary} />} />
    </Routes>
  );
}
