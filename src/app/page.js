'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================
// BOT API (Railway backend)
// ============================================================
const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://railway-up-production-f5a0.up.railway.app';

// ============================================================
// COLORS
// ============================================================
const C = {
  bg: '#0a0a0a', surface: '#141414', surfaceHover: '#1a1a1a',
  border: '#222', borderLight: '#333',
  text: '#e8e8e8', textMuted: '#888', textDim: '#555',
  accent: '#6366f1', accentHover: '#818cf8', accentDim: '#312e81',
  green: '#22c55e', greenDim: '#14532d',
  red: '#ef4444', redDim: '#7f1d1d',
  blue: '#3b82f6', blueDim: '#1e3a5f',
  purple: '#a855f7',
};

// ============================================================
// MOBILE DETECTION HOOK
// ============================================================
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ============================================================
// ICONS
// ============================================================
function Icon({ name, size = 18 }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const map = {
    home: <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    messages: <svg {...s}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>,
    content: <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    upload: <svg {...s}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
    settings: <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    check: <svg {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    send: <svg {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    logout: <svg {...s}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    plus: <svg {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    menu: <svg {...s}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  };
  return map[name] || null;
}

// ============================================================
// SMALL COMPONENTS
// ============================================================
function StatusBadge({ status }) {
  const m = {
    pending_approval: { l: 'Needs Review', bg: C.accentDim, c: C.accent },
    approved: { l: 'Approved', bg: C.greenDim, c: C.green },
    published: { l: 'Published', bg: C.blueDim, c: C.blue },
    rejected: { l: 'Rejected', bg: C.redDim, c: C.red },
    draft: { l: 'Draft', bg: '#1a1a2e', c: C.purple },
  };
  const d = m[status] || m.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: d.bg, color: d.c, fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.c }} />
      {d.l}
    </span>
  );
}

function ActionBadge({ action }) {
  const labels = { content_request: 'Content', content_generation: 'Content', inventory_check: 'Inventory', sales_report: 'Sales', scheduling: 'Scheduling' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {labels[action] || action || 'General'}
    </span>
  );
}

function Btn({ children, variant = 'primary', onClick, style: sx, ...props }) {
  const base = { padding: '10px 20px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' };
  const variants = {
    primary: { ...base, background: C.accent, color: '#fff' },
    ghost: { ...base, background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}` },
    success: { ...base, background: C.greenDim, color: C.green, border: `1px solid ${C.green}33` },
    danger: { ...base, background: C.redDim, color: C.red, border: `1px solid ${C.red}33` },
  };
  return <button onClick={onClick} style={{ ...variants[variant], ...sx }} {...props}>{children}</button>;
}

// ============================================================
// AUTH SCREEN
// ============================================================
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [barName, setBarName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToSMS, setAgreedToSMS] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!phone) { setError('Please enter your phone number'); setLoading(false); return; }
        if (!agreedToSMS) { setError('Please agree to receive SMS messages'); setLoading(false); return; }
        if (!agreedToTerms) { setError('Please agree to the Terms of Service'); setLoading(false); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          const { error: insertErr } = await supabase.from('customers').insert({
            user_id: data.user.id,
            bar_name: barName || 'My Bar',
            email,
            phone: phone || '',
          });
          if (insertErr) console.error('Customer insert error:', insertErr);
          if (data.session) {
            const { data: customers } = await supabase.from('customers').select('*').eq('user_id', data.user.id);
            onAuth({ user: data.user, session: data.session, customer: customers?.[0] });
          } else {
            setError('Check your email to confirm your account, then sign in.');
            setMode('login');
          }
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        const { data: customers } = await supabase.from('customers').select('*').eq('user_id', data.user.id);
        onAuth({ user: data.user, session: data.session, customer: customers?.[0] });
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputStyle = { width: '100%', padding: '12px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle = { display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.text, letterSpacing: '-0.03em', fontFamily: "'Space Mono', monospace" }}>SIDECAR</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Customer Portal</div>
        </div>

        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 32 }}>
          <div style={{ display: 'flex', marginBottom: 24, background: C.bg, borderRadius: 8, padding: 3 }}>
            {['login', 'signup'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, padding: '10px 0', background: mode === m ? C.surface : 'transparent', color: mode === m ? C.text : C.textMuted, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s', fontFamily: 'inherit' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Bar Name</label>
                <input type="text" value={barName} onChange={(e) => setBarName(e.target.value)} placeholder="The Velvet Room" required style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourbar.com" required style={inputStyle} />
            </div>
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" required style={inputStyle} />
              </div>
            )}
            {mode === 'signup' && (
              <div style={{ marginBottom: 16, background: '#0a0a0a', border: '1px solid #222', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input type="checkbox" checked={agreedToSMS} onChange={(e) => setAgreedToSMS(e.target.checked)} style={{ marginTop: 3, accentColor: '#6366f1', width: 18, height: 18, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#e8e8e8', lineHeight: 1.5 }}>I agree to receive SMS and text messages from Sidecar at the phone number provided. Messages will include task confirmations, inventory updates, content deliverables, review responses, and operational support. Message frequency varies. Msg & data rates may apply. Reply STOP to cancel, HELP for help.</span>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" required minLength={8} style={inputStyle} />
            </div>
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required style={inputStyle} />
              </div>
            )}
            {mode === 'signup' && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ marginTop: 3, accentColor: '#6366f1', width: 18, height: 18, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>I agree to the <a href="/terms" target="_blank" style={{ color: '#6366f1', textDecoration: 'none' }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: '#6366f1', textDecoration: 'none' }}>Privacy Policy</a></span>
              </div>
            )}
            <div style={{ marginBottom: 24 }}></div>

            {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: error.includes('Check your email') ? C.greenDim : C.redDim, color: error.includes('Check your email') ? C.green : C.red, fontSize: 13 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 0', background: C.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ customer, messages, contentItems }) {
  const isMobile = useIsMobile();
  const pendingCount = contentItems.filter(c => c.status === 'pending_approval').length;
  const stats = [
    { label: 'Messages This Week', value: String(messages.length || 0), change: 'From SMS + portal', up: null },
    { label: 'Content Pending', value: String(pendingCount), change: pendingCount > 0 ? 'Awaiting your review' : 'All clear', up: null },
    { label: 'Subscription', value: (customer?.subscription_tier || 'trial').replace('the_', 'The ').replace('_', ' '), change: 'Active', up: null },
    { label: 'Member Since', value: customer?.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Today', change: customer?.bar_name || '', up: null },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
          Welcome back{customer?.contact_name ? `, ${customer.contact_name.split(' ')[0]}` : ''}
        </h1>
        <p style={{ fontSize: 14, color: C.textMuted, margin: '8px 0 0 0' }}>
          Here&apos;s what&apos;s happening at {customer?.bar_name || 'your bar'}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? 10 : 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 14 : 20 }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: C.text, fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: isMobile ? 10 : 12, color: s.up ? C.green : C.textMuted, marginTop: 6 }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Recent Messages</span>
        </div>
        {messages.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 14 }}>
            No messages yet. Text <span style={{ color: C.accent, fontFamily: "'Space Mono', monospace" }}>+1 (844) 840-0637</span> to get started!
          </div>
        ) : (
          messages.slice(0, 5).map((m, i) => (
            <div key={m.id} style={{ padding: '14px 20px', borderBottom: i < Math.min(messages.length, 5) - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.direction === 'inbound' ? C.accent : C.blue, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.message || m.response}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
              {!isMobile && <ActionBadge action={m.action_taken} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// MESSAGES VIEW
// ============================================================
function MessagesView({ messages: initialMessages, customer, onNewMessage }) {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useCallback(node => { if (node) node.scrollIntoView({ behavior: 'smooth' }); }, []);

  useEffect(() => { setMessages(initialMessages); }, [initialMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempMsg = { id: `temp-${Date.now()}`, message: text, response: null, created_at: new Date().toISOString(), action_taken: null };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`${BOT_URL}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, customer_id: customer?.id }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, response: data.reply, action_taken: 'general' } : m));
        onNewMessage?.();
      } else {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, response: data.error || 'Failed to get response' } : m));
      }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, response: `Connection error: ${e.message}` } : m));
    }
    setSending(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.text, margin: 0 }}>Messages</h1>
        <p style={{ fontSize: 14, color: C.textMuted, margin: '8px 0 0 0' }}>Your conversation history with Sidecar</p>
      </div>

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ maxHeight: isMobile ? 400 : 500, overflowY: 'auto', padding: isMobile ? 12 : 20 }}>
          {messages.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>
              <p style={{ fontSize: 14, marginBottom: 8 }}>No messages yet</p>
              <p style={{ fontSize: 13 }}>Text <span style={{ color: C.accent, fontFamily: "'Space Mono', monospace" }}>+1 (844) 840-0637</span> or send a message below</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 20 }}>
                {m.message && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <div style={{ maxWidth: isMobile ? '85%' : '75%', background: C.accent, color: '#fff', borderRadius: '16px 16px 4px 16px', padding: '10px 16px', fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                      {m.message}
                    </div>
                  </div>
                )}
                {m.response ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'Space Mono', monospace" }}>S</div>
                    <div>
                      <div style={{ maxWidth: isMobile ? '85%' : '75%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '16px 16px 16px 4px', padding: '10px 16px', fontSize: 14, color: C.text, lineHeight: 1.5 }}>
                        {m.response}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingLeft: 4 }}>
                        <span style={{ fontSize: 11, color: C.textDim }}>
                          {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                        {!isMobile && m.action_taken && <ActionBadge action={m.action_taken} />}
                      </div>
                    </div>
                  </div>
                ) : m.message ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'Space Mono', monospace" }}>S</div>
                    <div style={{ padding: '10px 16px', fontSize: 13, color: C.textDim, fontStyle: 'italic' }}>Thinking...</div>
                  </div>
                ) : null}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, padding: isMobile ? 10 : 16, display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Send a message..."
            disabled={sending}
            style={{ flex: 1, padding: '12px 16px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 16, outline: 'none', fontFamily: 'inherit', opacity: sending ? 0.6 : 1 }}
          />
          <Btn onClick={handleSend} style={{ opacity: sending ? 0.6 : 1, padding: isMobile ? '10px 14px' : '10px 20px' }}>
            <Icon name="send" size={16} /> {!isMobile && (sending ? '...' : 'Send')}
          </Btn>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: C.textDim, textAlign: 'center' }}>
        You can also text +1 (844) 840-0637 to chat with Sidecar directly
      </div>
    </div>
  );
}

// ============================================================
// CONTENT VIEW
// ============================================================
function ContentView({ contentItems, onRefresh }) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState(contentItems);

  useEffect(() => { setItems(contentItems); }, [contentItems]);

  const handleApprove = async (id) => {
    await supabase.from('content_items').update({ status: 'approved' }).eq('id', id);
    setItems(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    onRefresh?.();
  };

  const handleReject = async (id) => {
    await supabase.from('content_items').update({ status: 'rejected' }).eq('id', id);
    setItems(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
    onRefresh?.();
  };

  const pending = items.filter(c => c.status === 'pending_approval');
  const rest = items.filter(c => c.status !== 'pending_approval');

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.text, margin: 0 }}>Content</h1>
          <p style={{ fontSize: 14, color: C.textMuted, margin: '8px 0 0 0' }}>Review and manage AI-generated content</p>
        </div>
        <Btn style={{ padding: isMobile ? '8px 14px' : '10px 20px', fontSize: isMobile ? 13 : 14 }}><Icon name="plus" size={16} /> Request Content</Btn>
      </div>

      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Needs Your Review ({pending.length})
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {pending.map((item) => (
              <div key={item.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.accent}33`, padding: isMobile ? 16 : 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{item.title || item.content_type}</span>
                  <StatusBadge status={item.status} />
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{item.caption || item.body}</div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <Btn variant="success" onClick={() => handleApprove(item.id)} style={{ padding: '8px 16px', fontSize: 13 }}>
                    <Icon name="check" size={14} /> Approve
                  </Btn>
                  <Btn variant="danger" onClick={() => handleReject(item.id)} style={{ padding: '8px 16px', fontSize: 13 }}>
                    <Icon name="x" size={14} /> Reject
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>All Content</span>
        </div>
        {rest.length === 0 && pending.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 14 }}>
            No content yet. Text Sidecar &quot;make me 4 Instagram posts&quot; to get started!
          </div>
        ) : (
          rest.map((item, i) => (
            <div key={item.id} style={{ padding: '14px 20px', borderBottom: i < rest.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.title || item.content_type}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(item.caption || item.body || '').slice(0, 80)}...</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// UPLOADS VIEW
// ============================================================
function UploadsView({ customer }) {
  const isMobile = useIsMobile();
  const [uploads, setUploads] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (customer?.id) loadUploads();
  }, [customer?.id]);

  const loadUploads = async () => {
    const { data } = await supabase.from('uploads').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false });
    if (data) setUploads(data);
  };

  const handleFiles = async (files) => {
    if (!customer?.id) return;
    setUploading(true);
    for (const file of files) {
      const filePath = `${customer.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('uploads').upload(filePath, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
        await supabase.from('uploads').insert({
          customer_id: customer.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          url: publicUrl,
        });
      }
    }
    await loadUploads();
    setUploading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.text, margin: 0 }}>Uploads</h1>
        <p style={{ fontSize: 14, color: C.textMuted, margin: '8px 0 0 0' }}>Upload photos, menus, and files for AI content generation</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = 'image/*,.pdf'; input.onchange = (e) => handleFiles(Array.from(e.target.files)); input.click(); }}
        style={{ background: dragActive ? C.accentDim : C.surface, border: `2px dashed ${dragActive ? C.accent : C.borderLight}`, borderRadius: 16, padding: isMobile ? '32px 16px' : '48px 24px', textAlign: 'center', marginBottom: 24, cursor: 'pointer', transition: 'all 0.2s' }}
      >
        <div style={{ marginBottom: 12, color: C.textMuted }}><Icon name="upload" size={32} /></div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>
          {uploading ? 'Uploading...' : isMobile ? 'Tap to upload files' : 'Drag & drop files here'}
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>{isMobile ? 'Photos, menus, event flyers, logos' : 'or click to browse — photos, menus, event flyers, logos'}</div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 12 }}>Supported: JPG, PNG, PDF, HEIC</div>
      </div>

      <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Your Files</span>
        </div>
        {uploads.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 14 }}>No files uploaded yet</div>
        ) : (
          uploads.map((f, i) => (
            <div key={f.id} style={{ padding: '14px 20px', borderBottom: i < uploads.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: f.file_type?.includes('image') ? C.blueDim : C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: f.file_type?.includes('image') ? C.blue : C.accent, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace" }}>
                {f.file_type?.includes('image') ? 'IMG' : 'PDF'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{f.file_name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>
                  {f.file_size ? `${(f.file_size / 1024 / 1024).toFixed(1)} MB` : ''} • {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// BRAND PROFILE REDIRECT
function BrandProfileRedirect() {
  if (typeof window !== "undefined") window.location.href = "/brand-profile";
  return <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#888",fontSize:15}}>Redirecting to Brand Profile...</div>;
}
// SETTINGS VIEW
// ============================================================
function SettingsView({ customer, onUpdate }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({
    bar_name: customer?.bar_name || '',
    contact_name: customer?.contact_name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    instagram_handle: customer?.instagram_handle || '',
    address: customer?.address || '',
    brand_voice: customer?.brand_voice || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!customer?.id) return;
    setSaving(true);
    const { error } = await supabase.from('customers').update(form).eq('id', customer.id);
    if (!error) {
      setSaved(true);
      onUpdate?.({ ...customer, ...form });
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.text, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 14, color: C.textMuted, margin: '8px 0 0 0' }}>Manage your bar profile and preferences</p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 16 : 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 20px 0' }}>Bar Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {[
              { key: 'bar_name', label: 'Bar Name' },
              { key: 'contact_name', label: 'Contact Name' },
              { key: 'phone', label: 'Phone' },
              { key: 'email', label: 'Email' },
              { key: 'instagram_handle', label: 'Instagram' },
              { key: 'address', label: 'Address' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                <input type="text" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 16 : 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 8px 0' }}>Brand Voice</h3>
          <p style={{ fontSize: 13, color: C.textMuted, margin: '0 0 16px 0' }}>Set your bar's tone, visual style, content preferences, and delivery method</p>
          <a href="/brand-profile" style={{ display: 'inline-block', padding: '12px 24px', background: C.accent, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: 'inherit' }}>Edit Brand Voice Profile →</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn onClick={handleSave} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </Btn>
          {saved && <span style={{ fontSize: 13, color: C.green }}>Changes saved successfully</span>}
        </div>

        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? 16 : 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 12px 0' }}>Subscription</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: '6px 14px', borderRadius: 8, background: C.accentDim, color: C.accent, fontSize: 14, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
              {(customer?.subscription_tier || 'trial').replace('the_', 'THE ').replace('_', ' ').toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: C.green }}>Active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: 'The Well', price: '$500', desc: 'SMS bot, basic content' },
              { name: 'The Double', price: '$1,500', desc: 'Everything + content engine' },
              { name: 'The Full Pour', price: '$2,500', desc: 'Full automation suite' },
            ].map((tier, i) => {
              const isActive = customer?.subscription_tier === tier.name.toLowerCase().replace('the ', 'the_').replace(' ', '_');
              return (
                <div key={i} style={{ padding: 16, borderRadius: 10, border: `1px solid ${isActive ? C.accent : C.border}`, background: isActive ? C.accentDim + '44' : 'transparent', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{tier.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent, fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>{tier.price}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{tier.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function SidecarPortal() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [messages, setMessages] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUserData(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadUserData(session.user);
      else { setAuth(null); setCustomer(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (user) => {
    setAuth(user);
    const { data: customers } = await supabase.from('customers').select('*').eq('user_id', user.id);
    const cust = customers?.[0];
    setCustomer(cust);

    if (cust) {
      const { data: msgs } = await supabase.from('messages').select('*').eq('customer_id', cust.id).order('created_at', { ascending: true }).limit(50);
      setMessages(msgs || []);

      const { data: content } = await supabase.from('content_items').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false });
      setContentItems(content || []);
    }
  };

  const handleAuth = ({ user, session, customer: cust }) => {
    setAuth(user);
    setCustomer(cust);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuth(null);
    setCustomer(null);
    setMessages([]);
    setContentItems([]);
  };

  const handleNavClick = (viewId) => {
    setActiveView(viewId);
    if (isMobile) setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'Space Mono', monospace" }}>SIDECAR</div>
      </div>
    );
  }

  if (!auth) return <AuthScreen onAuth={handleAuth} />;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'messages', label: 'Messages', icon: 'messages' },
    { id: 'content', label: 'Content', icon: 'content' },
    { id: 'uploads', label: 'Uploads', icon: 'upload' },
    { id: 'brand', label: 'Brand Profile', icon: 'settings' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const pendingCount = contentItems.filter(c => c.status === 'pending_approval').length;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView customer={customer} messages={messages} contentItems={contentItems} />;
      case 'messages': return <MessagesView messages={messages} customer={customer} onNewMessage={() => customer && loadUserData(auth)} />;
      case 'content': return <ContentView contentItems={contentItems} onRefresh={() => customer && loadUserData(auth)} />;
      case 'uploads': return <UploadsView customer={customer} />;
      case 'brand': return <BrandProfileRedirect />;
      case 'settings': return <SettingsView customer={customer} onUpdate={setCustomer} />;
      default: return <DashboardView customer={customer} messages={messages} contentItems={contentItems} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, overflow: 'hidden', maxWidth: '100vw' }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 198, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: 240,
        background: C.surface,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : -260,
          bottom: 0,
          zIndex: 199,
          transition: 'left 0.25s ease',
          boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.4)' : 'none',
        } : {}),
      }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "'Space Mono', monospace", letterSpacing: '-0.02em' }}>SIDECAR</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
              {customer?.bar_name || auth?.email}
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}>
              <Icon name="x" size={20} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleNavClick(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: activeView === item.id ? C.accentDim + '66' : 'transparent', color: activeView === item.id ? C.accent : C.textMuted, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: activeView === item.id ? 600 : 400, textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit', marginBottom: 2 }}>
              <Icon name={item.icon} size={18} />
              {item.label}
              {item.id === 'content' && pendingCount > 0 && (
                <span style={{ marginLeft: 'auto', background: C.accent, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 8px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', color: C.textMuted, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, textAlign: 'left', fontFamily: 'inherit' }}>
            <Icon name="logout" size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100vw' }}>
        {/* Mobile header */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, position: 'sticky', top: 0, zIndex: 100 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: 4 }}>
              <Icon name="menu" size={22} />
            </button>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Space Mono', monospace" }}>SIDECAR</div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: C.textMuted }}>{customer?.bar_name || ''}</div>
          </div>
        )}

        <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '32px 40px', overflowY: 'auto', maxWidth: isMobile ? '100%' : 960 }}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
