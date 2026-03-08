'use client';
import { useState, useEffect } from 'react';
const C = { bg:'#0a0a0a', surface:'#141414', border:'#222', text:'#e8e8e8', textMuted:'#888', textDim:'#555', accent:'#6366f1', accentDim:'#312e81', green:'#22c55e', greenDim:'#14532d', red:'#ef4444', redDim:'#7f1d1d', blue:'#3b82f6', blueDim:'#1e3a5f' };
const ADMIN_KEY = 'sidecar-admin-2026';
const BOT = 'https://railway-up-production-f5a0.up.railway.app';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [key, setKey] = useState('');
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [botStatus, setBotStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const login = () => { if (key === ADMIN_KEY) setAuthed(true); };

  useEffect(() => {
    if (!authed) return;
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [authed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, tasksRes, logsRes] = await Promise.all([
        fetch(`${BOT}/`).then(r=>r.json()).catch(()=>null),
        fetch(`${BOT}/api/tasks`).then(r=>r.json()).catch(()=>[]),
        fetch(`${BOT}/logs`).then(r=>r.json()).catch(()=>[]),
      ]);
      if (statusRes) setBotStatus(statusRes);
      if (Array.isArray(tasksRes)) setTasks(tasksRes);
      if (Array.isArray(logsRes)) setLogs(logsRes.reverse());

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (data) setCustomers(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateTask = async (id, status) => {
    try {
      await fetch(`${BOT}/api/tasks/${id}/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status}) });
      loadData();
    } catch(e) { console.error(e); }
  };

  const runApprovals = async () => {
    try {
      const r = await fetch(`${BOT}/api/poll-approvals?key=sidecar-secret`);
      const d = await r.json();
      alert(`Processed ${d.processed} approved tasks`);
      loadData();
    } catch(e) { alert('Error: '+e.message); }
  };

  if (!authed) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{maxWidth:400,width:'100%',textAlign:'center'}}>
        <div style={{fontSize:24,fontWeight:700,color:C.accent,letterSpacing:3,fontFamily:"'Space Mono', monospace",marginBottom:8}}>SIDECAR</div>
        <div style={{fontSize:14,color:C.textMuted,marginBottom:32}}>Admin Dashboard</div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:32}}>
          <input type="password" value={key} onChange={e=>setKey(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')login();}} placeholder="Admin key" style={{width:'100%',padding:'14px 16px',background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:16,outline:'none',boxSizing:'border-box',fontFamily:'inherit',marginBottom:16}}/>
          <button onClick={login} style={{width:'100%',padding:'14px 0',background:C.accent,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Enter</button>
        </div>
      </div>
    </div>
  );

  const pendingTasks = tasks.filter(t=>t.status==='pending');
  const doneTasks = tasks.filter(t=>t.status==='done');
  const activeCust = customers.filter(c=>c.subscription_tier&&c.subscription_tier!=='trial');
  const trialCust = customers.filter(c=>!c.subscription_tier||c.subscription_tier==='trial');
  const tierPrices = {the_well:500,the_double:1500,the_full_pour:2500,well:500,double:1500,full_pour:2500};
  const mrr = activeCust.reduce((s,c)=>s+(tierPrices[c.subscription_tier]||0),0);

  return (
    <div style={{minHeight:'100vh',background:C.bg,padding:'24px 16px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:12}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:C.accent,letterSpacing:3,fontFamily:"'Space Mono', monospace"}}>SIDECAR ADMIN</div>
          <div style={{fontSize:13,color:C.textMuted,marginTop:4}}>
            {botStatus ? `Bot v3 | Uptime: ${botStatus.uptime} | ${loading?'Refreshing...':'Live'}` : 'Connecting...'}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={runApprovals} style={{padding:'8px 16px',background:C.greenDim,color:C.green,border:`1px solid ${C.green}33`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Run Approvals</button>
          <button onClick={loadData} style={{padding:'8px 16px',background:C.surface,color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:12,marginBottom:24}}>
        {[
          {label:'MRR',value:`$${mrr.toLocaleString()}`,color:C.green},
          {label:'Customers',value:customers.length,color:C.accent},
          {label:'Active',value:activeCust.length,color:C.blue},
          {label:'Trial',value:trialCust.length,color:C.textMuted},
          {label:'Pending Tasks',value:pendingTasks.length,color:pendingTasks.length>0?C.red:C.green},
          {label:'Completed',value:doneTasks.length,color:C.green},
        ].map((s,i)=>(
          <div key={i} style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:16,textAlign:'center'}}>
            <div style={{fontSize:11,color:C.textMuted,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.color,fontFamily:"'Space Mono', monospace"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:C.surface,borderRadius:10,padding:4}}>
        {['overview','customers','tasks','logs'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'10px 0',background:tab===t?C.accentDim:'transparent',color:tab===t?C.accent:C.textMuted,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize'}}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab==='overview'&&(
        <div>
          <h3 style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:12}}>Pending Tasks ({pendingTasks.length})</h3>
          {pendingTasks.length===0?<div style={{padding:24,textAlign:'center',color:C.textMuted,background:C.surface,borderRadius:12,border:`1px solid ${C.border}`}}>All clear! No pending tasks.</div>:
          <div style={{display:'grid',gap:8}}>
            {pendingTasks.slice(0,10).map(t=>(
              <div key={t.id} style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                      <span style={{padding:'2px 8px',borderRadius:4,background:C.accentDim,color:C.accent,fontSize:11,fontWeight:600,textTransform:'uppercase'}}>{t.category}</span>
                      <span style={{padding:'2px 8px',borderRadius:4,background:t.urgency==='urgent'?C.redDim:t.urgency==='high'?'#7f5500':C.surface,color:t.urgency==='urgent'?C.red:t.urgency==='high'?'#f59e0b':C.textMuted,fontSize:11,fontWeight:600,textTransform:'uppercase'}}>{t.urgency}</span>
                    </div>
                    <div style={{fontSize:14,color:C.text,marginBottom:4}}>{t.summary?.substring(0,120)}{t.summary?.length>120?'...':''}</div>
                    <div style={{fontSize:12,color:C.textDim}}>{t.phone} | {new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>updateTask(t.id,'done')} style={{padding:'6px 12px',background:C.greenDim,color:C.green,border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Done</button>
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}

      {/* Customers */}
      {tab==='customers'&&(
        <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,fontSize:14,fontWeight:600,color:C.text}}>All Customers ({customers.length})</div>
          {customers.map((c,i)=>(
            <div key={c.id} style={{padding:'12px 16px',borderBottom:i<customers.length-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:C.text}}>{c.bar_name||'Unnamed'}</div>
                <div style={{fontSize:12,color:C.textMuted}}>{c.contact_name||''} | {c.email||''} | {c.phone||''}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:c.subscription_tier&&c.subscription_tier!=='trial'?C.greenDim:C.accentDim,color:c.subscription_tier&&c.subscription_tier!=='trial'?C.green:C.accent}}>{(c.subscription_tier||'trial').toUpperCase()}</span>
                <span style={{fontSize:11,color:C.textDim}}>{c.created_at?new Date(c.created_at).toLocaleDateString():''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      {tab==='tasks'&&(
        <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,fontSize:14,fontWeight:600,color:C.text}}>All Tasks ({tasks.length})</div>
          {tasks.slice(0,30).map((t,i)=>(
            <div key={t.id} style={{padding:'12px 16px',borderBottom:i<Math.min(tasks.length,30)-1?`1px solid ${C.border}`:'none',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontSize:13,color:C.text}}>{t.summary?.substring(0,80)}</div>
                <div style={{fontSize:11,color:C.textDim}}>{t.category} | {t.phone} | {new Date(t.created_at).toLocaleString()}</div>
              </div>
              <span style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:t.status==='done'?C.greenDim:t.status==='pending'?C.accentDim:C.surface,color:t.status==='done'?C.green:t.status==='pending'?C.accent:C.textMuted}}>{t.status?.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Logs */}
      {tab==='logs'&&(
        <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,fontSize:14,fontWeight:600,color:C.text}}>Bot Logs (last 50)</div>
          <div style={{maxHeight:500,overflowY:'auto'}}>
            {logs.slice(0,50).map((l,i)=>(
              <div key={i} style={{padding:'8px 16px',borderBottom:`1px solid ${C.border}`,fontSize:12,fontFamily:"'Space Mono', monospace"}}>
                <span style={{color:C.textDim}}>{new Date(l.time).toLocaleTimeString()}</span>
                <span style={{color:l.action.includes('error')?C.red:l.action.includes('airtable')?C.green:l.action.includes('sms')?C.blue:C.accent,marginLeft:8}}>[{l.action}]</span>
                <span style={{color:C.textMuted,marginLeft:8}}>{l.detail?.substring(0,100)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
