'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://railway-up-production-f5a0.up.railway.app';
const SIDECAR_SMS = '+18448400637';

const T = {
  bg:          '#080808',
  surface:     '#111',
  surfaceUp:   '#161616',
  border:      '#1e1e1e',
  borderHi:    '#2a2a2a',
  text:        '#efefef',
  textMid:     '#777',
  textLow:     '#3a3a3a',
  accent:      '#6366f1',
  accentLo:    '#1e1d3a',
  accentHi:    '#818cf8',
  green:       '#22c55e',
  greenLo:     '#0d2218',
  amber:       '#f59e0b',
  amberLo:     '#261d08',
  red:         '#ef4444',
  redLo:       '#200f0f',
  mono:        "'Space Mono', 'Courier New', monospace",
  sans:        "'DM Sans', system-ui, sans-serif",
};

const PLAN_META = {
  trial:         { label: 'Trial',         color: T.amber,  bg: T.amberLo,  posts: 4    },
  the_well:      { label: 'The Well',      color: T.accent, bg: T.accentLo, posts: 8    },
  the_double:    { label: 'The Double',    color: T.accent, bg: T.accentLo, posts: 20   },
  the_full_pour: { label: 'The Full Pour', color: T.green,  bg: T.greenLo,  posts: '∞'  },
  churned:       { label: 'Churned',       color: T.red,    bg: T.redLo,    posts: 0    },
};

function planMeta(tier) { return PLAN_META[tier] || PLAN_META.trial; }

function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CATEGORY_COLORS = {
  social:   { text: '#a78bfa', bg: '#1a1535' },
  ordering: { text: '#34d399', bg: '#0d2218' },
  reviews:  { text: '#60a5fa', bg: '#0d1b35' },
  hiring:   { text: '#f472b6', bg: '#2a1020' },
  events:   { text: '#fb923c', bg: '#251508' },
  image:    { text: '#a78bfa', bg: '#1a1535' },
  general:  { text: T.textMid, bg: T.surface  },
};

function CategoryPill({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: T.mono,
    }}>{category || 'general'}</span>
  );
}

function StatusDot({ status }) {
  const map = { pending: T.amber, done: T.green, approved: T.green, rejected: T.red };
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: map[status] || T.textLow, flexShrink: 0 }} />;
}

// ─── AUTH SCREEN ─────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [confirm, setConfirm] = useState('');
  const [barName, setBar]     = useState('');
  const [phone, setPhone]     = useState('');
  const [smsOk, setSmsOk]     = useState(false);
  const [termsOk, setTermsOk] = useState(false);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (mode === 'signup') {
        if (!phone)   { setErr('Phone number required'); setLoading(false); return; }
        if (!smsOk)   { setErr('Please agree to SMS messages'); setLoading(false); return; }
        if (!termsOk) { setErr('Please agree to Terms of Service'); setLoading(false); return; }
        if (password !== confirm) { setErr('Passwords do not match'); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('customers').insert({ user_id: data.user.id, bar_name: barName || 'My Bar', email, phone });
          if (data.session) {
            const { data: c } = await supabase.from('customers').select('*').eq('user_id', data.user.id);
            onAuth({ user: data.user, customer: c?.[0] });
          } else {
            setErr('Check your email to confirm, then sign in.');
            setMode('login');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: c } = await supabase.from('customers').select('*').eq('user_id', data.user.id);
        onAuth({ user: data.user, customer: c?.[0] });
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: T.sans }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.text, fontFamily: T.mono, letterSpacing: '0.1em' }}>SIDECAR</div>
          <div style={{ fontSize: 12, color: T.textMid, marginTop: 6, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Customer Portal</div>
        </div>
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 28 }}>
          <div style={{ display: 'flex', background: T.bg, borderRadius: 8, padding: 3, marginBottom: 24 }}>
            {['login','signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(''); }} style={{
                flex: 1, padding: '9px 0', background: mode === m ? T.surface : 'transparent',
                color: mode === m ? T.text : T.textMid, border: 'none', borderRadius: 6,
                cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: T.sans, transition: 'all 0.15s',
              }}>{m === 'login' ? 'Sign In' : 'Sign Up'}</button>
            ))}
          </div>
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bar Name</label>
                <input value={barName} onChange={e => setBar(e.target.value)} placeholder="The Velvet Room" style={FIELD_STYLE} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@yourbar.com" style={FIELD_STYLE} />
            </div>
            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1 (555) 555-5555" style={FIELD_STYLE} />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <input type="password" value={password} onChange={e => setPass(e.target.value)} required minLength={8} placeholder="8+ characters" style={FIELD_STYLE} />
            </div>
            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Re-enter password" style={FIELD_STYLE} />
              </div>
            )}
            {mode === 'signup' && (
              <div style={{ marginBottom: 14, padding: 12, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={smsOk} onChange={e => setSmsOk(e.target.checked)} style={{ marginTop: 2, accentColor: T.accent, width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>I agree to receive SMS messages from Sidecar. Msg & data rates may apply. Reply STOP to cancel.</span>
                </label>
              </div>
            )}
            {mode === 'signup' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={termsOk} onChange={e => setTermsOk(e.target.checked)} style={{ marginTop: 2, accentColor: T.accent, width: 16, height: 16, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
                    I agree to the <a href="/terms" target="_blank" style={{ color: T.accent, textDecoration: 'none' }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color: T.accent, textDecoration: 'none' }}>Privacy Policy</a>
                  </span>
                </label>
              </div>
            )}
            {err && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: err.includes('Check') ? T.greenLo : T.redLo, color: err.includes('Check') ? T.green : T.red, fontSize: 13 }}>{err}</div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px 0', background: T.accent, color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              fontFamily: T.sans, transition: 'opacity 0.15s',
            }}>{loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT VIEW ─────────────────────────────────────────────
function AccountView({ customer, tasks }) {
  const plan = planMeta(customer?.subscription_tier);
  const recentTasks = (tasks || []).slice(0, 8);

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Hero — SMS CTA */}
      <div style={{
        background: T.accentLo, border: `1px solid ${T.accent}33`,
        borderRadius: 14, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, color: T.accentHi, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Sidecar Number</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.text, fontFamily: T.mono, letterSpacing: '0.04em' }}>{SIDECAR_SMS}</div>
          <div style={{ fontSize: 13, color: T.textMid, marginTop: 6 }}>Text anything — ordering, reviews, social, hiring, events</div>
        </div>
        <a href={`sms:${SIDECAR_SMS}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 22px', background: T.accent, color: '#fff',
          borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
          fontFamily: T.sans, whiteSpace: 'nowrap',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>
          Text Sidecar
        </a>
      </div>

      {/* Bar info + plan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Bar</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{customer?.bar_name || '—'}</div>
          <div style={{ fontSize: 13, color: T.textMid, marginTop: 4 }}>{customer?.contact_name || customer?.email}</div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Plan</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 6, background: plan.bg, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: plan.color, display: 'inline-block' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: plan.color, fontFamily: T.mono }}>{plan.label}</span>
          </div>
          <div style={{ fontSize: 12, color: T.textMid, marginBottom: 8 }}>
            {plan.posts === '∞' ? 'Unlimited posts/week' : `${plan.posts} posts/week`}
          </div>
          {(customer?.subscription_tier === 'trial' || customer?.subscription_tier === 'churned') && (
            <a href="/upgrade" style={{
              display: 'inline-block', padding: '5px 12px', background: T.accent,
              color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 700,
              textDecoration: 'none', fontFamily: T.sans,
            }}>Upgrade →</a>
          )}
        </div>
      </div>

      {/* Recent tasks */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Recent Activity</span>
          <span style={{ fontSize: 12, color: T.textMid }}>{recentTasks.length} tasks</span>
        </div>
        {recentTasks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMid, fontSize: 14 }}>
            No activity yet — text Sidecar to get started.
          </div>
        ) : recentTasks.map((t, i) => (
          <div key={t.id} style={{
            padding: '14px 20px',
            borderBottom: i < recentTasks.length - 1 ? `1px solid ${T.border}` : 'none',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <StatusDot status={t.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.4, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.full_message || t.summary || '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <CategoryPill category={t.category} />
                <span style={{ fontSize: 11, color: T.textMid }}>{relTime(t.created_at)}</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: t.status === 'done' ? T.green : T.amber, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, fontFamily: T.mono }}>
              {t.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────
// BUG FIX: Field is defined inside SettingsView but uses local `values` state
// and individual setters to avoid re-render losing focus on every keystroke.
const FIELD_STYLE = {
  width: "100%", padding: "10px 14px",
  background: T.bg, border: `1px solid ${T.border}`,
  borderRadius: 8, color: T.text, fontSize: 15,
  outline: "none", boxSizing: "border-box", fontFamily: T.sans,
};

function SettingsView({ customer, onUpdate }) {
  // Use individual state vars instead of a form object to prevent focus loss
  const [barName,       setBarName]       = useState(customer?.bar_name          || '');
  const [contactName,   setContactName]   = useState(customer?.contact_name      || '');
  const [phone,         setPhone]         = useState(customer?.phone             || '');
  const [email,         setEmail]         = useState(customer?.email             || '');
  const [address,       setAddress]       = useState(customer?.address           || '');
  const [instagram,     setInstagram]     = useState(customer?.instagram_handle  || '');
  const [facebook,      setFacebook]      = useState(customer?.facebook_handle   || '');
  const [tiktok,        setTiktok]        = useState(customer?.tiktok_handle     || '');
  const [twitter,       setTwitter]       = useState(customer?.twitter_handle    || '');
  const [brandVoice,    setBrandVoice]    = useState(customer?.brand_voice       || '');
  const [feedback,      setFeedback]      = useState('');
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [fbSent,        setFbSent]        = useState(false);

  const save = async () => {
    if (!customer?.id) return;
    setSaving(true);
    const updates = {
      bar_name: barName, contact_name: contactName, phone, email, address,
      instagram_handle: instagram, facebook_handle: facebook,
      tiktok_handle: tiktok, twitter_handle: twitter, brand_voice: brandVoice,
    };
    const { error } = await supabase.from('customers').update(updates).eq('id', customer.id);
    if (!error) {
      setSaved(true);
      onUpdate?.({ ...customer, ...updates });
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    await fetch(`${BOT_URL}/api/send-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'ryan@getsidecarhq.com', subject: `Portal feedback from ${customer?.bar_name || customer?.email}`, body: `From: ${customer?.bar_name} (${customer?.email})\n\n${feedback}` }),
    });
    setFbSent(true); setFeedback('');
    setTimeout(() => setFbSent(false), 3000);
  };

  const Section = ({ title, children }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 580 }}>
      <Section title="Bar Profile">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bar Name</label>
            <input value={barName} onChange={e => setBarName(e.target.value)} placeholder="The Velvet Room" style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Name</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Your name" style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 555-5555" style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourbar.com" style={FIELD_STYLE} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, New York, NY" style={FIELD_STYLE} />
          </div>
        </div>
      </Section>

      <Section title="Social Handles">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instagram</label>
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourbar" style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>TikTok</label>
            <input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@yourbar" style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Facebook</label>
            <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="yourbar" style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Twitter / X</label>
            <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@yourbar" style={FIELD_STYLE} />
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
          Sidecar uses your social handles to match your existing aesthetic when creating content.
        </div>
      </Section>

      <Section title="Brand Voice">
        <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Describe your vibe</label>
        <textarea
          value={brandVoice}
          onChange={e => setBrandVoice(e.target.value)}
          placeholder="e.g. Dark and moody craft cocktail bar. Sophisticated but approachable. Think speakeasy vibes..."
          rows={4}
          style={{ ...FIELD_STYLE, resize: 'vertical', lineHeight: 1.6 }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: T.textMid }}>The more specific, the better. This shapes everything Sidecar writes for you.</div>
      </Section>

      <div style={{ marginBottom: 32 }}>
        <button onClick={save} disabled={saving} style={{
          padding: '11px 24px', background: saved ? T.greenLo : T.accent,
          color: saved ? T.green : '#fff', border: saved ? `1px solid ${T.green}44` : 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.7 : 1, fontFamily: T.sans, transition: 'all 0.2s',
        }}>{saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}</button>
      </div>

      <Section title="Send Feedback">
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Something not working? Feature request? We read everything."
          rows={3}
          style={{ ...FIELD_STYLE, resize: 'vertical', marginBottom: 10 }}
        />
        <button onClick={sendFeedback} style={{
          padding: '10px 20px', background: T.surfaceUp, color: T.text,
          border: `1px solid ${T.borderHi}`, borderRadius: 8, fontSize: 13,
          fontWeight: 600, cursor: 'pointer', fontFamily: T.sans,
        }}>{fbSent ? '✓ Sent — thanks!' : 'Send Feedback'}</button>
      </Section>
    </div>
  );
}

// ─── PLAN VIEW ────────────────────────────────────────────────
// Updated pricing: $299 / $799 / $1,999. Upgrade button links to /upgrade page.
function PlanView({ customer }) {
  const current = customer?.subscription_tier || 'trial';
  const tiers = [
    { key: 'the_well',      name: 'The Well',      price: '$299',   period: '/mo', posts: 8,   desc: 'SMS bot, content creation, review responses, ordering.' },
    { key: 'the_double',    name: 'The Double',     price: '$799',   period: '/mo', posts: 20,  desc: 'Everything in The Well plus hiring, events, image gen, social automation.' },
    { key: 'the_full_pour', name: 'The Full Pour',  price: '$1,999', period: '/mo', posts: '∞', desc: 'Full automation suite. Unlimited everything. Dedicated support.' },
  ];

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Current Plan</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 8, background: planMeta(current).bg }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: planMeta(current).color }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: planMeta(current).color, fontFamily: T.mono }}>{planMeta(current).label}</span>
          </div>
        </div>
        {(current === 'trial' || current === 'churned') && (
          <a href="/upgrade" style={{
            padding: '10px 20px', background: T.accent, color: '#fff',
            borderRadius: 8, fontSize: 14, fontWeight: 700,
            textDecoration: 'none', fontFamily: T.sans,
          }}>Upgrade Now →</a>
        )}
      </div>

      <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
        {tiers.map(tier => {
          const isActive = current === tier.key;
          return (
            <div key={tier.key} style={{
              background: isActive ? T.accentLo : T.surface,
              border: `1px solid ${isActive ? T.accent + '44' : T.border}`,
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{tier.name}</span>
                  {isActive && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: T.accent, color: '#fff', fontWeight: 600 }}>Current</span>}
                </div>
                <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5, maxWidth: 320 }}>{tier.desc}</div>
                <div style={{ fontSize: 12, color: T.textMid, marginTop: 6 }}>
                  {tier.posts === '∞' ? 'Unlimited posts/week' : `${tier.posts} social posts/week`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{tier.price}</div>
                <div style={{ fontSize: 12, color: T.textMid }}>{tier.period}</div>
                {!isActive && (
                  <a href="/upgrade" style={{
                    display: 'inline-block', marginTop: 8, padding: '5px 14px',
                    background: T.accent, color: '#fff', borderRadius: 6,
                    fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: T.sans,
                  }}>Select</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '16px 20px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
        <div style={{ fontSize: 13, color: T.textMid }}>
          No contracts. Cancel anytime. Questions?{' '}
          <a href="mailto:ryan@getsidecarhq.com" style={{ color: T.accent, textDecoration: 'none' }}>ryan@getsidecarhq.com</a>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function SidecarPortal() {
  const [auth, setAuth]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [customer, setCustomer] = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [view, setView]         = useState('account');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUser(session.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) loadUser(session.user);
      else { setAuth(null); setCustomer(null); setTasks([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async (user) => {
    setAuth(user);
    const { data: c } = await supabase.from('customers').select('*').eq('user_id', user.id);
    const cust = c?.[0];
    setCustomer(cust);
    if (cust?.id) {
      const { data: t } = await supabase.from('tasks').select('*').eq('customer_id', cust.id).order('created_at', { ascending: false }).limit(20);
      setTasks(t || []);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuth(null); setCustomer(null); setTasks([]);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '0.1em' }}>SIDECAR</div>
    </div>
  );

  if (!auth) return <AuthScreen onAuth={({ user, customer: c }) => { setAuth(user); setCustomer(c); }} />;

  const navItems = [
    { id: 'account',  label: 'Account'  },
    { id: 'settings', label: 'Settings' },
    { id: 'plan',     label: 'Plan'     },
  ];

  const renderView = () => {
    switch (view) {
      case 'account':  return <AccountView customer={customer} tasks={tasks} />;
      case "settings": return <SettingsView key="settings" customer={customer} onUpdate={useCallback((c) => setCustomer(c), [])} />;
      case 'plan':     return <PlanView customer={customer} />;
      default:         return <AccountView customer={customer} tasks={tasks} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text }}>

      {/* Top nav — single nav bar, no duplicate mobile strip */}
      <div style={{
        height: 56, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 24,
        background: T.surface, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.mono, letterSpacing: '0.1em', color: T.text, flexShrink: 0 }}>
          SIDECAR
        </div>

        {/* Nav pills */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              padding: '6px 14px',
              background: view === n.id ? T.accentLo : 'transparent',
              color: view === n.id ? T.accentHi : T.textMid,
              border: view === n.id ? `1px solid ${T.accent}33` : '1px solid transparent',
              borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 500,
              fontFamily: T.sans, transition: 'all 0.15s',
            }}>{n.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: T.textMid }}>{customer?.bar_name}</span>
          <button onClick={logout} style={{
            padding: '6px 14px', background: 'transparent', color: T.textMid,
            border: `1px solid ${T.border}`, borderRadius: 7,
            cursor: 'pointer', fontSize: 13, fontFamily: T.sans,
          }}>Sign Out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 24px', maxWidth: 720, margin: '0 auto' }}>
        {renderView()}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        input, textarea, button { font-family: ${T.sans}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.borderHi}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
