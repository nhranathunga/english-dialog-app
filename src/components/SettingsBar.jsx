export default function SettingsBar({ mode, setMode, rate, setRate, useGoogle, setUseGoogle, isPremium, onBuyPremium }) {
  return (
    <div className="bar">
      <span className="pill">
        Mode:&nbsp;
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="strict">Strict</option>
        </select>
      </span>

      <span className="pill">
        TTS speed:&nbsp;
        <input
          type="range"
          min="0.7"
          max="1.2"
          step="0.05"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
        <span className="mono">{rate.toFixed(2)}</span>
      </span>

      <span className="pill" style={{flexGrow: 1}}>
        <label style={{display:'flex', alignItems:'center', fontSize:'13px', cursor:'pointer', color: useGoogle ? '#e0ac4f' : 'inherit'}}>
            <input 
              type="checkbox" 
              checked={useGoogle} 
              onClick={(e) => {
                  if (!isPremium) {
                      e.preventDefault();
                      onBuyPremium();
                  }
              }}
              onChange={(e) => {
                  if (isPremium) {
                      setUseGoogle(e.target.checked);
                  }
              }} 
              style={{marginRight:'8px'}}
            /> 
            {isPremium ? "Natural Voice" : "Natural Voice 💎"}
        </label>
      </span>
    </div>
  );
}
