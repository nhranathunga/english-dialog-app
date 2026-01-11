export default function DialogCard({ title, appLine, expectedLine, isUserTurn }) {
  return (
    <div className="practice-stage">
      {/* Partner Chat Row */}
      <div className={`chat-row left ${!isUserTurn ? 'active' : ''}`}>
        <div className="avatar partner">🤖</div>
        <div className="bubble partner">
          <div className="label-sm">Partner</div>
          <p>{appLine || "..."}</p>
        </div>
      </div>

      {/* User Chat Row */}
      <div className={`chat-row right ${isUserTurn ? 'active' : ''}`}>
        <div className="bubble user">
          <div className="label-sm">You</div>
          <p>{expectedLine || "..."}</p>
        </div>
        <div className="avatar user">👤</div>
      </div>
    </div>
  );
}
