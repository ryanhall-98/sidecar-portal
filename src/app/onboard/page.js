'use client';
import { useState } from 'react';
const C = { bg:'#0a0a0a', surface:'#141414', border:'#222', text:'#e8e8e8', textMuted:'#888', textDim:'#555', accent:'#6366f1', accentDim:'#312e81', green:'#22c55e', red:'#ef4444' };
const inputStyle = { width:'100%', padding:'14px 16px', background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:16, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
const labelStyle = { display:'block', fontSize:12, color:C.textMuted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 };
export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'', barName:'', address:'', barType:'cocktail_bar', instagram:'', needs:[], agreedToSMS:false, agreedToTerms:false });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleNeed = (n) => setForm(p=>({...p, needs: p.needs.includes(n) ? p.needs.filter(x=>x!==n) : [...p.needs, n]}));
  const needOptions = ['Review Responses','Social Media','Vendor Ordering','Hiring','Events & Promos','Menu Costing','Email Marketing','Inbox Management'];
  const handleSubmit = async () => {
    if (!form.agreedToSMS) { setError('Please agree to receive SMS messages'); return; }
    if (!form.agreedToTerms) { setError('Please agree to the Terms of Service'); return; }
    setLoading(true); setError('');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authErr) throw authErr;
      if (data.user) { await supabase.from('customers').insert({ user_id: data.user.id, contact_name: form.name, email: form.email, phone: form.phone, bar_name: form.barName, address: form.address, bar_type: form.barType, instagram_handle: form.instagram, needs: form.needs, subscription_tier: 'trial', status: 'trial' }); }
      setSuccess(true);
    } catch (err) { setError(err.message || 'Something went wrong'); }
    setLoading(false);
  };
  if (success) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{maxWidth:480,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16}}>🎉</div>
        <h1 style={{fontSize:32,fontWeight:700,color:C.text,marginBottom:12}}>You&apos;re in.</h1>
        <p style={{fontSize:16,color:C.textMuted,lineHeight:1.6}}>Check your email to verify, then text us anything:</p>
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,margin:'24px 0'}}>
          <p style={{fontSize:28,color:C.accent,fontFamily:"'Space Mono', monospace",fontWeight:700}}>(844) 840-0637</p>
        </div>
        <a href="/" style={{display:'inline-block',padding:'14px 32px',background:C.accent,color:'#fff',borderRadius:10,fontSize:15,fontWeight:600,textDecoration:'none'}}>Go to Portal</a>
      </div>
    </div>
  );
  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:520}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <a href="https://sidecarhq.cc" style={{textDecoration:'none'}}><div style={{fontSize:24,fontWeight:700,color:C.accent,letterSpacing:3,fontFamily:"'Space Mono', monospace"}}>SIDECAR</div></a>
          <p style={{fontSize:14,color:C.textMuted,marginTop:8}}>Set up your back office in 60 seconds</p>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:32}}>{[1,2,3].map(s=>(<div key={s} style={{flex:1,height:4,borderRadius:2,background:s<=step?C.accent:C.border,transition:'background 0.3s'}}/>))}</div>
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:32}}>
          {step===1&&(<div>
            <h2 style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:4}}>Create your account</h2>
            <p style={{fontSize:14,color:C.textMuted,marginBottom:24}}>Takes 30 seconds. No credit card.</p>
            <div style={{display:'grid',gap:16}}>
              <div><label style={labelStyle}>Your Name</label><input type="text" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Jane Smith" style={inputStyle}/></div>
              <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@yourbar.com" style={inputStyle}/></div>
              <div><label style={labelStyle}>Phone Number</label><input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="(555) 555-5555" style={inputStyle}/></div>
              <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                  <input type="checkbox" checked={form.agreedToSMS} onChange={e=>set('agreedToSMS',e.target.checked)} style={{marginTop:3,accentColor:C.accent,width:18,height:18,flexShrink:0}}/>
                  <span style={{fontSize:13,color:C.text,lineHeight:1.5}}>I agree to receive SMS and text messages from Sidecar at the phone number provided. Messages will include task confirmations, inventory updates, content deliverables, review responses, and operational support. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to cancel, HELP for help.</span>
                </div>
              </div>
              <div><label style={labelStyle}>Password</label><input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="8+ characters" style={inputStyle}/></div>
              <div><label style={labelStyle}>Confirm Password</label><input type="password" value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} placeholder="Re-enter password" style={inputStyle}/></div>
              
              
            </div>
            {error&&<div style={{marginTop:16,padding:'10px 14px',borderRadius:8,background:'#7f1d1d',color:C.red,fontSize:13}}>{error}</div>}
            <button onClick={()=>{if(!form.name||!form.email||!form.password||!form.phone){setError('Fill in all fields');return;}if(!form.agreedToSMS){setError('Please agree to receive SMS messages');return;}if(form.password.length<8){setError('Password must be at least 8 characters');return;}if(form.password!==form.confirmPassword){setError('Passwords do not match');return;}setError('');setStep(2);}} style={{width:'100%',marginTop:24,padding:'14px 0',background:C.accent,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Continue</button>
          </div>)}
          {step===2&&(<div>
            <h2 style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:4}}>Tell us about your bar</h2>
            <p style={{fontSize:14,color:C.textMuted,marginBottom:24}}>So we can hit the ground running.</p>
            <div style={{display:'grid',gap:16}}>
              <div><label style={labelStyle}>Bar Name</label><input type="text" value={form.barName} onChange={e=>set('barName',e.target.value)} placeholder="The Velvet Room" style={inputStyle}/></div>
              <div><label style={labelStyle}>Address</label><input type="text" value={form.address} onChange={e=>set('address',e.target.value)} placeholder="123 E 7th St, New York" style={inputStyle}/></div>
              <div><label style={labelStyle}>Instagram Handle</label><input type="text" value={form.instagram} onChange={e=>set('instagram',e.target.value)} placeholder="@yourbar" style={inputStyle}/></div>
            </div>
            <div style={{display:'flex',gap:12,marginTop:24}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:'14px 0',background:'transparent',color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Back</button>
              <button onClick={()=>{if(!form.barName){setError('Enter your bar name');return;}setError('');setStep(3);}} style={{flex:2,padding:'14px 0',background:C.accent,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Continue</button>
            </div>
          </div>)}
          {step===3&&(<div>
            <h2 style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:4}}>Almost done</h2>
            <p style={{fontSize:14,color:C.textMuted,marginBottom:24}}>What do you need help with?</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>{needOptions.map(n=>{const a=form.needs.includes(n);return(<button key={n} onClick={()=>toggleNeed(n)} style={{padding:'8px 14px',borderRadius:20,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',border:'none',background:a?C.accentDim:C.bg,color:a?C.accent:C.textMuted,outline:`1px solid ${a?C.accent+'66':C.border}`}}>{n}</button>);})}</div>
            <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
              <input type="checkbox" checked={form.agreedToTerms} onChange={e=>set('agreedToTerms',e.target.checked)} style={{marginTop:3,accentColor:C.accent,width:18,height:18,flexShrink:0}}/>
              <span style={{fontSize:13,color:C.textMuted,lineHeight:1.5}}>I agree to the <a href="/terms" target="_blank" style={{color:C.accent,textDecoration:'none'}}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{color:C.accent,textDecoration:'none'}}>Privacy Policy</a></span>
            </div>
            {error&&<div style={{marginTop:16,padding:'10px 14px',borderRadius:8,background:'#7f1d1d',color:C.red,fontSize:13}}>{error}</div>}
            <div style={{display:'flex',gap:12,marginTop:24}}>
              <button onClick={()=>setStep(2)} style={{flex:1,padding:'14px 0',background:'transparent',color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Back</button>
              <button onClick={handleSubmit} disabled={loading} style={{flex:2,padding:'14px 0',background:C.accent,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:loading?'wait':'pointer',fontFamily:'inherit',opacity:loading?0.7:1}}>{loading?'Creating account...':'Start Free Trial'}</button>
            </div>
          </div>)}
        </div>
        <div style={{textAlign:'center',marginTop:20,fontSize:12,color:C.textDim}}>
          <a href="/terms" style={{color:C.textMuted,textDecoration:'none',marginRight:16}}>Terms of Service</a>
          <a href="/privacy" style={{color:C.textMuted,textDecoration:'none'}}>Privacy Policy</a>
        </div>
        <p style={{textAlign:'center',marginTop:12,fontSize:13,color:C.textDim}}>Already have an account? <a href="/" style={{color:C.accent,textDecoration:'none'}}>Sign in</a></p>
      </div>
    </div>
  );
}
