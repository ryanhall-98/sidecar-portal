'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://railway-up-production-f5a0.up.railway.app';

const T = {
  bg:       '#080808', surface: '#0f0f0f', surfaceUp: '#141414',
  border:   '#1c1c1c', borderHi: '#252525',
  text:     '#f0f0f0', textMid: '#686868', textDim: '#2e2e2e',
  accent:   '#6366f1', accentLo: '#1a1935', accentHi: '#818cf8',
  green:    '#22c55e', greenLo: '#0a1f12',
  red:      '#ef4444', redLo: '#1f0a0a',
  mono:     "'Space Mono', monospace",
  sans:     "'DM Sans', system-ui, sans-serif",
};

const PLAN = {
  key:       'sidecar',
  name:      'Sidecar',
  price:     199,
  priceId:   'YOUR_NEW_PRICE_ID', // TODO: replace with new $199 Stripe price ID
  color:     T.accent,
  bg:        T.accentLo,
  desc:      'Your entire back office via text. Every feature, no limits, no upsells.',
  features:  [
    'Google & Yelp review responses — drafted & ready to post',
    'Unlimited AI social posts & captions in your voice',
    'Custom image & graphic generation (DALL-E HD)',
    'Purchase orders drafted & sent to distributors',
    'SMS inventory tracking — text your counts',
    'Low-stock alerts & automated reorder triggers',
    'SKU map + 7am distributor reorder alerts',
    'Demand forecasting — "what should I order?"',
    'Happy hour & combo specials recommendations',
    'Keg kicked tracking & auto-reorder queue',
    'Delivery receipt scanning via photo',
    'POS integration (Square, Toast, Clover, Lightspeed)',
    'Automated weekly sales reports & CSV export',
    'Event & promo copy written & distributed',
    'Hiring posts written & distributed',
    'Inbox & DM drafts',
    'AI pour cost analysis',
    'Team member access — add your staff',
  ],
};

export default function UpgradePage() {
  const [customer, setCustomer]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [err, setErr]             = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/'; return; }
      const { data: c } = await supabase.from('customers').select('*').eq('user_id', session.user.id);
      setCustomer(c?.[0] || null);
      setLoading(false);
    });
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === '1') {
      setTimeout(() => window.location.reload(), 1000);
    }
  }, []);

  const checkout = async () => {
    if (loading || !customer?.id) { setErr('No account found. Please sign in first.'); return; }
    setCheckingOut(true);
    setErr('');
    try {
      const r = await fetch(`${BOT_URL}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.id,
          price_id: PLAN.priceId,
          success_url: `${window.location.origin}/upgrade?upgraded=1`,
          cancel_url: `${window.location.origin}/upgrade`,
        }),
      });
      const d = await r.json();
      if (d.url) { window.location.href = d.url; }
      else { setErr(d.error || 'Something went wrong. Try again.'); setCheckingOut(false); }
    } catch(e) { setErr(e.message); setCheckingOut(false); }
  };

  const manageBilling = async () => {
    if (loading || !customer?.id) return;
    setManagingBilling(true);
    try {
      const r = await fetch(`${BOT_URL}/api/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customer.id, return_url: window.location.href }),
      });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else setErr(d.error || 'Could not open billing portal.');
    } catch(e) { setErr(e.message); }
    setManagingBilling(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '0.1em' }}>SIDECAR</div>
    </div>
  );

  const currentTier = customer?.subscription_tier || 'trial';
  const isPaying = !['trial', 'churned'].includes(currentTier);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text }}>
      <div style={{
        height: 52, background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <a href="/" style={{ fontSize: 15, fontWeight: 700, color: T.accent, letterSpacing: '0.12em', fontFamily: T.mono, textDecoration: 'none' }}>SIDECAR</a>
        <span style={{ fontSize: 12, color: T.textMid }}>/ Upgrade</span>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/" style={{ fontSize: 13, color: T.textMid, textDecoration: 'none' }}>← Back to portal</a>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: T.text, marginBottom: 12 }}>One plan. Everything included.</div>
          <div style={{ fontSize: 16, color: T.textMid }}>No contracts. Cancel anytime. 7-day free trial.</div>

          {currentTier === 'trial' && customer?.trial_ends_at && (
            <div style={{ marginTop: 16, fontSize: 13, color: T.accent }}>
              Trial ends {new Date(customer.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
          {currentTier === 'churned' && (
            <div style={{ marginTop: 16, padding: '12px 20px', background: T.redLo, border: `1px solid ${T.red}33`, borderRadius: 8, display: 'inline-block', fontSize: 13, color: T.red }}>
              Your account is paused — subscribe below to reactivate
            </div>
          )}
        </div>

        {err && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: T.redLo, border: `1px solid ${T.red}33`, borderRadius: 8, color: T.red, fontSize: 13, textAlign: 'center' }}>{err}</div>
        )}

        <div style={{
          background: T.surfaceUp, border: `1px solid ${isPaying ? T.green + '66' : T.accent + '33'}`,
          borderRadius: 14, padding: '32px 28px', position: 'relative',
        }}>
          {isPaying && (
            <div style={{
              position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
              background: T.green, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px',
              borderRadius: '0 0 6px 6px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: T.mono,
            }}>Active</div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 4 }}>{PLAN.name}</div>
            <div style={{ fontSize: 13, color: T.textMid, marginBottom: 16 }}>{PLAN.desc}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 42, fontWeight: 700, color: T.accent, fontFamily: T.mono }}>${PLAN.price}</span>
              <span style={{ fontSize: 14, color: T.textMid }}>/mo per location</span>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            {PLAN.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ color: T.green, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 13, color: T.textMid, lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>

          {isPaying ? (
            <button onClick={manageBilling} disabled={managingBilling} style={{
              width: '100%', padding: '14px 0', background: T.surface, color: T.textMid,
              border: `1px solid ${T.border}`, borderRadius: 9, fontSize: 14, fontWeight: 700,
              cursor: managingBilling ? 'default' : 'pointer', fontFamily: T.sans,
            }}>
              {managingBilling ? 'Opening...' : 'Manage billing'}
            </button>
          ) : (
            <button onClick={checkout} disabled={checkingOut} style={{
              width: '100%', padding: '14px 0', background: T.accent, color: '#fff',
              border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700,
              cursor: checkingOut ? 'default' : 'pointer', opacity: checkingOut ? 0.7 : 1, fontFamily: T.sans,
            }}>
              {checkingOut ? 'Opening checkout...' : currentTier === 'churned' ? 'Reactivate — $199/mo' : 'Start Free Trial →'}
            </button>
          )}

          <p style={{ textAlign: 'center', fontSize: 12, color: T.textDim, marginTop: 14 }}>
            No contracts. Cancel anytime. Multi-location? <a href="mailto:ryan@sidecarhq.cc" style={{ color: T.accent }}>Contact us</a>.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: T.textMid }}>
          Questions? <a href="mailto:ryan@sidecarhq.cc" style={{ color: T.accent, textDecoration: 'none' }}>ryan@sidecarhq.cc</a>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; }
      `}</style>
    </div>
  );
}
