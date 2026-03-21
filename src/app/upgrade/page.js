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
  amber:    '#6366f1', amberLo: '#1e1b4b',
  red:      '#ef4444', redLo: '#1f0a0a',
  blue:     '#38bdf8', blueLo: '#0a1a2f',
  mono:     "'Space Mono', monospace",
  sans:     "'DM Sans', system-ui, sans-serif",
};

// Price IDs — must match Railway env
const PLANS = [
  {
    key:       'the_well',
    name:      'The Well',
    price:     299,
    priceId:   'price_1TDQqX0TxmXo6nUk2gvIHAn7',
    posts:     8,
    color:     T.accent,
    bg:        T.accentLo,
    desc:      'SMS back office for independent bars.',
    features:  ['Ordering & vendor emails', 'Google/Yelp review responses', 'Social content creation', '8 posts/week', 'Image generation'],
  },
  {
    key:       'the_double',
    name:      'The Double',
    price:     799,
    priceId:   'price_1TDQr10TxmXo6nUkVoHaZSZl',
    posts:     20,
    color:     T.blue,
    bg:        T.blueLo,
    popular:   true,
    desc:      'Everything in The Well, plus automation.',
    features:  ['Everything in The Well', 'Hiring & job posts', 'Event promos & flyers', '20 posts/week', 'Social automation'],
  },
  {
    key:       'the_full_pour',
    name:      'The Full Pour',
    price:     1999,
    priceId:   'price_1TAiWp0TxmXo6nUk7tTMLel8',
    posts:     999,
    color:     T.green,
    bg:        T.greenLo,
    desc:      'Full automation suite. Unlimited everything.',
    features:  ['Everything in The Double', 'Unlimited posts/week', 'Multi-location support', 'Dedicated founder support', 'Priority turnaround'],
  },
];

export default function UpgradePage() {
  const [customer, setCustomer]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [checkingOut, setCheckingOut] = useState(null); // price key being checked out
  const [managingBilling, setManagingBilling] = useState(false);
  const [err, setErr]             = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/'; return; }
      const { data: c } = await supabase.from('customers').select('*').eq('user_id', session.user.id);
      setCustomer(c?.[0] || null);
      setLoading(false);
    });

    // Handle return from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === '1') {
      // Reload customer data to get updated tier
      setTimeout(() => window.location.reload(), 1000);
    }
  }, []);

  const checkout = async (plan) => {
    if (loading) { setErr("Still loading your account — please wait a moment and try again."); return; }
    if (!customer?.id) { setErr("No account found. Please sign in first."); return; }
    setCheckingOut(plan.key);
    setErr('');
    try {
      const r = await fetch(`${BOT_URL}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.id,
          price_id: plan.priceId,
          success_url: `${window.location.origin}/upgrade?upgraded=1`,
          cancel_url: `${window.location.origin}/upgrade`,
        }),
      });
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        setErr(d.error || 'Something went wrong. Try again.');
        setCheckingOut(null);
      }
    } catch(e) {
      setErr(e.message);
      setCheckingOut(null);
    }
  };

  const manageBilling = async () => {
    if (loading) { setErr("Still loading your account — please wait a moment and try again."); return; }
    if (!customer?.id) { setErr("No account found. Please sign in first."); return; }
    setManagingBilling(true);
    try {
      const r = await fetch(`${BOT_URL}/api/billing-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.id,
          return_url: window.location.href,
        }),
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

      {/* Header */}
      <div style={{
        height: 52, background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <a href="/" style={{ fontSize: 15, fontWeight: 700, color: T.accent, letterSpacing: '0.12em', fontFamily: T.mono, textDecoration: 'none' }}>
          SIDECAR
        </a>
        <span style={{ fontSize: 12, color: T.textMid }}>/ Plans</span>
        <div style={{ marginLeft: 'auto' }}>
          <a href="/" style={{ fontSize: 13, color: T.textMid, textDecoration: 'none' }}>← Back to portal</a>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: T.text, marginBottom: 12, lineHeight: 1.2 }}>
            Pick your plan
          </div>
          <div style={{ fontSize: 16, color: T.textMid, maxWidth: 480, margin: '0 auto' }}>
            No contracts. Cancel anytime. All plans include the full SMS back office.
          </div>

          {/* Current plan badge */}
          {currentTier !== 'trial' && (
            <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 8, background: T.surfaceUp, border: `1px solid ${T.border}` }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isPaying ? T.green : T.amber, display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: T.textMid }}>
                Current plan: <span style={{ color: T.text, fontWeight: 600 }}>{PLANS.find(p => p.key === currentTier)?.name || currentTier}</span>
              </span>
              {isPaying && (
                <button onClick={manageBilling} disabled={loading || managingBilling} style={{
                  marginLeft: 8, padding: '3px 10px', background: 'transparent',
                  color: T.accent, border: `1px solid ${T.accent}44`,
                  borderRadius: 5, fontSize: 12, cursor: 'pointer', fontFamily: T.sans,
                }}>
                  {managingBilling ? '...' : 'Manage billing'}
                </button>
              )}
            </div>
          )}

          {currentTier === 'trial' && customer?.trial_ends_at && (
            <div style={{ marginTop: 16, fontSize: 13, color: T.amber }}>
              Trial ends {new Date(customer.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}

          {currentTier === 'churned' && (
            <div style={{ marginTop: 16, padding: '12px 20px', background: T.redLo, border: `1px solid ${T.red}33`, borderRadius: 8, display: 'inline-block', fontSize: 13, color: T.red }}>
              Your account is paused — pick a plan below to reactivate
            </div>
          )}
        </div>

        {/* Error */}
        {err && (
          <div style={{ marginBottom: 24, padding: '12px 16px', background: T.redLo, border: `1px solid ${T.red}33`, borderRadius: 8, color: T.red, fontSize: 13, textAlign: 'center' }}>
            {err}
          </div>
        )}

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
          {PLANS.map(plan => {
            const isCurrent = currentTier === plan.key;
            const isLoading = checkingOut === plan.key;

            return (
              <div key={plan.key} style={{
                background: plan.popular ? T.surfaceUp : T.surface,
                border: `1px solid ${isCurrent ? plan.color + '66' : plan.popular ? plan.color + '33' : T.border}`,
                borderRadius: 14, padding: '28px 24px',
                position: 'relative', display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.2s',
              }}>

                {/* Popular badge */}
                {plan.popular && !isCurrent && (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '3px 12px',
                    borderRadius: '0 0 6px 6px', letterSpacing: '0.08em', textTransform: 'uppercase',
                    fontFamily: T.mono,
                  }}>Most Popular</div>
                )}

                {/* Current badge */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '3px 12px',
                    borderRadius: '0 0 6px 6px', letterSpacing: '0.08em', textTransform: 'uppercase',
                    fontFamily: T.mono,
                  }}>Current Plan</div>
                )}

                {/* Plan name + price */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: T.textMid, marginBottom: 16 }}>{plan.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 700, color: plan.color, fontFamily: T.mono }}>${plan.price.toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: T.textMid }}>/mo</span>
                  </div>
                </div>

                {/* Features */}
                <div style={{ flex: 1, marginBottom: 24 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: plan.color, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: T.textMid, lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => !isCurrent && checkout(plan)}
                  disabled={loading || isCurrent || !!checkingOut}
                  style={{
                    width: '100%', padding: '13px 0',
                    background: isCurrent ? T.surfaceUp : plan.color,
                    color: isCurrent ? T.textMid : '#fff',
                    border: isCurrent ? `1px solid ${T.border}` : 'none',
                    borderRadius: 9, fontSize: 14, fontWeight: 700,
                    cursor: loading || isCurrent || checkingOut ? 'default' : 'pointer',
                    opacity: (checkingOut && !isLoading) || loading ? 0.5 : 1,
                    fontFamily: T.sans, transition: 'opacity 0.15s',
                  }}
                >
                  {isLoading ? 'Opening checkout...' : isCurrent ? 'Current plan' : currentTier === 'churned' ? 'Reactivate' : 'Select plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer notes */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: T.textMid, marginBottom: 8 }}>
            All plans billed monthly. Cancel anytime from your billing portal.
          </div>
          <div style={{ fontSize: 13, color: T.textMid }}>
            Questions?{' '}
            <a href="mailto:ryan@getsidecarhq.com" style={{ color: T.accent, textDecoration: 'none' }}>ryan@getsidecarhq.com</a>
            {' '}or text{' '}
            <a href="sms:+18448400637" style={{ color: T.accent, textDecoration: 'none' }}>+1 (844) 840-0637</a>
          </div>
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
