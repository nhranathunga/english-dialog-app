import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

export default function AdminDashboard({ library, setLibrary }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeLevel, setActiveLevel] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, premium: 0 });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch Users on Mount
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/users`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
          setStats({
             totalUsers: data.length,
             premium: data.filter(u => u.isPremium).length
          });
        }
      })
      .catch(err => console.error("Failed to load users", err));
  }, []);

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Content Helpers ---

  // Sync a specific level to backend
  const updateLevelInDb = async (levelId, newCategories) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/content/level/${levelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: newCategories })
      });
      
      if (!res.ok) throw new Error("Update failed");
      
      const updatedLevel = await res.json();
      
      // Update local state without full reload
      const newLib = { ...library };
      const idx = newLib.levels.findIndex(l => l.id === levelId);
      if (idx !== -1) newLib.levels[idx] = updatedLevel;
      setLibrary(newLib);
      
      showNotify(`Saved changes to ${levelId}`);
    } catch (e) {
      showNotify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = (levelId, catId) => {
    if (!window.confirm("Delete this category?")) return;
    const lvl = library.levels.find(l => l.id === levelId);
    if (!lvl) return;
    
    const newCats = lvl.categories.filter(c => c.id !== catId);
    updateLevelInDb(levelId, newCats);
  };
  
  const deleteDialog = (levelId, catId, dialogId) => {
    if (!window.confirm("Delete this dialog?")) return;
    const lvl = library.levels.find(l => l.id === levelId);
    if (!lvl) return;
    
    const newCats = lvl.categories.map(c => {
       if (c.id === catId) {
         return { ...c, dialogs: c.dialogs.filter(d => d.id !== dialogId) };
       }
       return c;
    });
    updateLevelInDb(levelId, newCats);
  };

  const handleFileUpload = (e, levelId, catId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            const lvl = library.levels.find(l => l.id === levelId);
            if (!lvl) return;
            
            let newCats = [...lvl.categories];

            if (catId) {
                // Add Dialogs to Category
                const dialogsToAdd = Array.isArray(data) ? data : (data.turns ? [data] : []);
                if (dialogsToAdd.length === 0) throw new Error("Invalid Dialog JSON");

                newCats = newCats.map(c => {
                   if (c.id === catId) {
                       return { ...c, dialogs: [...c.dialogs, ...dialogsToAdd] };
                   }
                   return c;
                });
            } else {
                // Add Categories to Level
                const catsToAdd = Array.isArray(data) ? data : (data.dialogs ? [data] : []);
                 if (catsToAdd.length === 0) throw new Error("Invalid Category JSON");
                 newCats = [...newCats, ...catsToAdd];
            }
            
            updateLevelInDb(levelId, newCats);
        } catch(err) {
            showNotify("Invalid JSON File", 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px', flexShrink: 0 }}>
        <h2 style={{color: 'var(--primary-hover)', marginBottom:'32px'}}>Admin Panel</h2>
        
        <nav style={{display:'flex', flexDirection:'column', gap:'8px'}}>
          <button 
             onClick={() => setActiveTab('dashboard')}
             style={tabStyle(activeTab === 'dashboard')}
          >
             📊 Dashboard
          </button>
          <button 
             onClick={() => setActiveTab('content')}
             style={tabStyle(activeTab === 'content')}
          >
             📚 Content Library
          </button>
          <button 
             onClick={() => setActiveTab('users')}
             style={tabStyle(activeTab === 'users')}
          >
             👥 Users
          </button>
        </nav>

        <div style={{marginTop: 'auto', paddingTop:'20px', borderTop:'1px solid #f1f5f9'}}>
            <button onClick={() => navigate('/')} className="back-btn" style={{width:'100%', justifyContent:'flex-start'}}>
               ← Back to App
            </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        
        {/* HEADER */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
             <h1 style={{fontSize:'24px', margin:0, textAlign: 'left'}}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
             {notification && (
                <div className={`card ${notification.type === 'error' ? 'bad' : 'good'}`} style={{padding:'8px 16px', borderRadius:'99px', margin:0}}>
                    {notification.msg}
                </div>
             )}
        </div>

        {/* --- DASHBOARD VIEW --- */}
        {activeTab === 'dashboard' && (
          <div className="grid">
              <div className="card">
                  <h3 style={{color: 'var(--text-muted)'}}>Total Users</h3>
                  <p className="big">{stats.totalUsers}</p>
              </div>
              <div className="card">
                  <h3 style={{color: 'var(--text-muted)'}}>Premium Members</h3>
                  <p className="big" style={{color: '#d97706'}}>{stats.premium}</p>
              </div>
              <div className="card">
                  <h3 style={{color: 'var(--text-muted)'}}>Total Dialogs</h3>
                  <p className="big">
                      {library?.levels?.reduce((acc, lvl) => acc + lvl.categories.reduce((c, cat) => c + cat.dialogs.length, 0), 0) || 0}
                  </p>
              </div>
          </div>
        )}

        {/* --- USERS VIEW --- */}
        {activeTab === 'users' && (
           <div className="card" style={{padding:0, overflow:'hidden'}}>
               <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                   <thead style={{background:'#f1f5f9'}}>
                       <tr>
                           <th style={thStyle}>Name</th>
                           <th style={thStyle}>Email</th>
                           <th style={thStyle}>Plan</th>
                           <th style={thStyle}>Joined</th>
                       </tr>
                   </thead>
                   <tbody>
                       {users.map(u => (
                           <tr key={u._id} style={{borderBottom:'1px solid #f1f5f9'}}>
                               <td style={tdStyle}>{u.name || '-'}</td>
                               <td style={tdStyle}>{u.email}</td>
                               <td style={tdStyle}>
                                   {u.isPremium ? 
                                     <span className="pill" style={{background:'#fef3c7', color:'#d97706'}}>Premium</span> : 
                                     <span className="pill" style={{background:'#f1f5f9'}}>Free</span>
                                   }
                               </td>
                               <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString()}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
        )}

        {/* --- CONTENT VIEW --- */}
        {activeTab === 'content' && (
            <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
                {library?.levels?.map(level => (
                    <div key={level.id} className="card">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f1f5f9', paddingBottom:'16px', marginBottom:'16px'}}>
                            <div>
                                <h2 style={{margin:0}}>{level.id} - {level.name}</h2>
                                <p style={{fontSize:'12px'}}>{level.categories.length} Topics</p>
                            </div>
                            <div style={{display:'flex', gap:'8px'}}>
                               <label className="secondary" style={{display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'8px 16px', borderRadius:'99px', background:'#e2e8f0', cursor:'pointer', fontSize:'13px', fontWeight:600}}>
                                   + Import Topic JSON
                                   <input type="file" hidden accept=".json" onChange={(e) => handleFileUpload(e, level.id)} />
                               </label>
                               <button 
                                  onClick={() => setActiveLevel(activeLevel === level.id ? null : level.id)}
                                  style={{background:'transparent', color:'var(--primary-hover)', border:'1px solid var(--primary-hover)'}}
                               >
                                   {activeLevel === level.id ? 'Collapse' : 'Expand'}
                               </button>
                            </div>
                        </div>
                        
                        {activeLevel === level.id && (
                            <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))'}}>
                                {level.categories.map(cat => (
                                    <div key={cat.id} style={{background:'#f8fafc', padding:'16px', borderRadius:'12px', border:'1px solid #e2e8f0'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                                            <h3 style={{fontSize:'16px', margin:0}}>{cat.name} {cat.isPremium && '⭐'}</h3>
                                            <button 
                                              onClick={() => deleteCategory(level.id, cat.id)}
                                              style={{color:'var(--danger)', background:'transparent', padding:0, fontSize:'12px'}}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        
                                        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                            {cat.dialogs.map(d => (
                                                <div key={d.id} style={{display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'6px', background:'white', borderRadius:'6px', border:'1px solid #f1f5f9'}}>
                                                    <span>{d.title}</span>
                                                    <span 
                                                       onClick={() => deleteDialog(level.id, cat.id, d.id)}
                                                       style={{cursor:'pointer', color:'#94a3b8'}}
                                                    >×</span>
                                                </div>
                                            ))}
                                            
                                            <label style={{marginTop:'8px', display:'block', textAlign:'center', border:'1px dashed #cbd5e1', padding:'8px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', color:'#64748b'}}>
                                                + Add Dialog JSON
                                                <input type="file" hidden accept=".json" onChange={(e) => handleFileUpload(e, level.id, cat.id)} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
}

const tabStyle = (active) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'left',
    background: active ? '#fefce8' : 'transparent',
    color: active ? '#b45309' : '#64748b',
    fontWeight: active ? 600 : 400,
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    justifyContent: 'flex-start'
});

const thStyle = { padding:'16px', textAlign:'left', color:'#475569', fontWeight:600 };
const tdStyle = { padding:'16px', color:'#1e293b' };
