export default function Controls({
  canSpeak,
  canListen,
  listening,
  onSpeakApp,
  onListenExpected,
  onStart,
  onStop,
  onSkip,
}) {
  return (
    <div style={{ marginTop: '32px' }}>
      {/* Central Big Mic Button - Functions as Status and Toggle */}
      <div 
        className={`mic-status ${listening ? 'listening' : 'off'}`} 
        onClick={listening ? onStop : onStart}
        style={{ cursor: canListen ? 'pointer' : 'not-allowed', opacity: canListen ? 1 : 0.5 }}
        title={listening ? "Tap to Stop" : "Tap to Speak"}
      >
        🎙
      </div>
      
      {/* Secondary Controls */}
      <div className="control-bar" style={{ marginTop: '24px' }}>
        <button className="icon-btn" onClick={onSpeakApp} disabled={!canSpeak} title="Replay Partner">
           🔊
        </button>
        <button className="icon-btn" onClick={onListenExpected} disabled={!canSpeak} title="Listen to Example">
           👂
        </button>
        <button className="icon-btn" onClick={onSkip} title="Skip">
           ⏭
        </button>
      </div>
    </div>
  );
}
