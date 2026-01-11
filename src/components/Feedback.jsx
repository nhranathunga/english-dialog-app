export default function Feedback({ transcript, score, resultLabel, feedback }) {
  return (
    <div className="feedback-area">
      {!transcript && <div style={{color:'#aaa', fontStyle:'italic', fontSize:'14px'}}>Your speech will appear here...</div>}
      
      {transcript && <div style={{fontSize:'18px', fontWeight: 500, marginBottom: 8}}>"{transcript}"</div>}

      {resultLabel && (
        <div style={{display:'flex', gap:10, justifyContent:'center', marginTop: 12}}>
           <span className="pill" style={{background: '#fff', border:'1px solid #ddd'}}>{resultLabel}</span>
           {score !== null && <span className="pill" style={{background: '#fff', border:'1px solid #ddd'}}>Score: {Math.round(score)}%</span>}
        </div>
      )}

      {feedback ? (
        <div
          className={`hint ${feedback.tone === "good" ? "good" : "bad"}`}
          style={{ marginTop: 12, fontSize: '14px' }}
          dangerouslySetInnerHTML={{ __html: feedback.html }}
        />
      ) : null}
    </div>
  );
}
