'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://railway-up-production-f5a0.up.railway.app';

const T = {
  bg: '#080808', surface: '#111', surfaceUp: '#161616',
  border: '#1e1e1e', borderHi: '#2a2a2a',
  text: '#efefef', textMid: '#777', textLow: '#3a3a3a',
  accent: '#6366f1', accentLo: '#1e1d3a', accentHi: '#818cf8',
  green: '#22c55e', greenLo: '#0d2218',
  amber: '#f59e0b', amberLo: '#251508',
  red: '#ef4444', redLo: '#200f0f',
  mono: "'Space Mono', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
};

export default function RepDashboard() {
  const [email, setEmail] = useState('');
  const [repName, setRepName] = useState('');
  const [distName, setDistName] = useState('');
  const [step, setStep] = useState('login'); // login | dashboard
  const [rep, setRep] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all'); // all | alerts | ok

  const login = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      // Check if rep exists
      let { data: existing } = await supabase
        .from('distributors')
        .select('*')
        .eq('rep_email', email.toLowerCase().trim())
        .single();

      if (!existing) {
        // Auto-create rep account
        const { data: created, error } = await supabase
          .from('distributors')
          .insert({
            name: distName || 'My Distributorship',
            rep_name: repName || email.split('@')[0],
            rep_email: email.toLowerCase().trim(),
          })
          .select().single();
        if (error) throw new Error(error.message);
        existing = created;
      }

      setRep(existing);
      await loadAccounts(existing.id);
      setStep('dashboard');
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  const loadAccounts = async (distId) => {
    setLoading(true);
    try {
      // Get all bars linked to this rep via sku_map
      const { data: skuLinks } = await supabase
        .from('sku_map')
        .select('customer_id, product_name, par_level, reorder_point, unit, distributor_name, rep_email')
        .eq('rep_email', email.toLowerCase().trim());

      if (!skuLinks || !skuLinks.length) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      // Get unique customer IDs
      const customerIds = [...new Set(skuLinks.map(s => s.customer_id))];

      // Fetch customer details
      const { data: customers } = await supabase
        .from('customers')
        .select('id, bar_name, phone, neighborhood, last_active_at')
        .in('id', customerIds);

      // Fetch inventory for each customer
      const accountData = [];
      for (const customer of (customers || [])) {
        const customerSkus = skuLinks.filter(s => s.customer_id === customer.id);

        const { data: inventory } = await supabase
          .from('bar_inventory')
          .select('name, current_stock, unit, par_level')
          .eq('customer_id', customer.id);

        // Match SKUs to inventory
        const skuStatus = customerSkus.map(sku => {
          const invItem = (inventory || []).find(i =>
            i.name.toLowerCase().includes(sku.product_name.toLowerCase()) ||
            sku.product_name.toLowerCase().includes(i.name.toLowerCase().split(' ')[0])
          );
          const stock = invItem ? parseFloat(invItem.current_stock) : null;
          const reorderAt = parseFloat(sku.reorder_point || sku.par_level);
          const needsReorder = stock !== null && stock <= reorderAt;
          return {
            product: sku.product_name,
            stock,
            unit: sku.unit,
            reorderAt,
            needsReorder,
            par: sku.par_level,
          };
        });

        const alertCount = skuStatus.filter(s => s.needsReorder).length;

        accountData.push({
          ...customer,
          skus: skuStatus,
          alertCount,
          hasAlerts: alertCount > 0,
        });
      }

      // Sort: alerts first
      accountData.sort((a, b) => b.alertCount - a.alertCount);
      setAccounts(accountData);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const filtered = accounts.filter(a => {
    if (filter === 'alerts') return a.hasAlerts;
    if (filter === 'ok') return !a.hasAlerts;
    return true;
  });

  const totalAlerts = accounts.filter(a => a.hasAlerts).length;

  if (step === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: T.sans }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.text, fontFamily: T.mono, letterSpacing: '0.1em' }}>SIDECAR</div>
            <div style={{ fontSize: 13, color: T.textMid, marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Distributor Rep Portal</div>
          </div>
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 28 }}>
            <p style={{ color: T.textMid, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              Enter your email to access your account inventory alerts across all your Sidecar bars.
            </p>
            <form onSubmit={login}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Name</label>
                <input value={repName} onChange={e => setRepName(e.target.value)} placeholder="Mike Johnson" style={FIELD} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Distributor Name</label>
                <input value={distName} onChange={e => setDistName(e.target.value)} placeholder="Southern Glazer's" style={FIELD} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Work Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@southernglazers.com" style={FIELD} />
              </div>
              {err && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: T.redLo, color: T.red, fontSize: 13 }}>{err}</div>}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px 0', background: T.accent, color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: T.sans,
              }}>{loading ? 'Loading...' : 'Access My Accounts'}</button>
            </form>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: T.textLow, marginTop: 20 }}>
            Powered by Sidecar · sidecarhq.cc
          </p>
        </div>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${T.bg}; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text }}>
      {/* Header */}
      <div style={{ height: 56, background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.mono, letterSpacing: '0.1em', color: T.text }}>SIDECAR</div>
        <span style={{ fontSize: 12, color: T.textMid }}>/ Rep Dashboard</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: T.textMid }}>{rep?.rep_name} · {rep?.name}</span>
          <button onClick={() => { setStep('login'); setRep(null); setAccounts([]); }} style={{
            padding: '6px 14px', background: 'transparent', color: T.textMid,
            border: `1px solid ${T.border}`, borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: T.sans,
          }}>Sign Out</button>
        </div>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Accounts', value: accounts.length, color: T.accent },
            { label: 'Need Reorder', value: totalAlerts, color: totalAlerts > 0 ? T.red : T.green },
            { label: 'All Good', value: accounts.length - totalAlerts, color: T.green },
          ].map((s, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: T.mono }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all', 'alerts', 'ok'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: filter === f ? T.accent : T.surface,
              color: filter === f ? '#fff' : T.textMid,
              fontSize: 13, fontWeight: 600, fontFamily: T.sans,
            }}>{f === 'all' ? 'All Accounts' : f === 'alerts' ? `⚠️ Need Reorder (${totalAlerts})` : '✓ Good Stock'}</button>
          ))}
          <button onClick={() => loadAccounts(rep?.id)} style={{
            marginLeft: 'auto', padding: '7px 14px', borderRadius: 7,
            background: T.surfaceUp, color: T.textMid, border: `1px solid ${T.borderHi}`,
            cursor: 'pointer', fontSize: 12, fontFamily: T.sans,
          }}>↻ Refresh</button>
        </div>

        {/* No accounts state */}
        {!loading && accounts.length === 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: T.textMid, marginBottom: 12 }}>No accounts linked yet.</div>
            <div style={{ fontSize: 13, color: T.textLow, lineHeight: 1.6 }}>
              When a bar owner maps a product to you via Sidecar, it will appear here automatically.<br/>
              Share your email ({email}) with bar owners so they can add you as their rep.
            </div>
          </div>
        )}

        {/* Account cards */}
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(account => (
            <div key={account.id} style={{
              background: T.surface,
              border: `1px solid ${account.hasAlerts ? T.red + '44' : T.border}`,
              borderRadius: 12, padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{account.bar_name}</div>
                  <div style={{ fontSize: 12, color: T.textMid }}>{account.neighborhood || 'NYC'} · {account.phone}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {account.hasAlerts && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700,
                      fontFamily: T.mono, background: T.redLo, color: T.red, border: `1px solid ${T.red}33`,
                    }}>⚠️ {account.alertCount} REORDER{account.alertCount > 1 ? 'S' : ''}</span>
                  )}
                  {!account.hasAlerts && (
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700,
                      fontFamily: T.mono, background: T.greenLo, color: T.green, border: `1px solid ${T.green}33`,
                    }}>✓ STOCKED</span>
                  )}
                  <a href={`sms:${account.phone}`} style={{
                    padding: '5px 12px', background: T.accent, color: '#fff',
                    borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: T.sans,
                  }}>Text Owner</a>
                </div>
              </div>

              {/* SKU table */}
              {account.skus.length > 0 && (
                <div style={{ display: 'grid', gap: 6 }}>
                  {account.skus.map((sku, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 7,
                      background: sku.needsReorder ? T.redLo : T.surfaceUp,
                      border: `1px solid ${sku.needsReorder ? T.red + '33' : T.borderHi}`,
                    }}>
                      <span style={{ fontSize: 13, color: T.text, fontWeight: sku.needsReorder ? 700 : 400 }}>{sku.product}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: T.textMid }}>par {sku.par}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: sku.needsReorder ? T.red : T.green, fontFamily: T.mono }}>
                          {sku.stock !== null ? `${sku.stock} ${sku.unit}` : 'unknown'}
                        </span>
                        {sku.needsReorder && <span style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>REORDER</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: T.textMid, fontSize: 14 }}>Loading accounts...</div>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; } body { background: ${T.bg}; margin: 0; }`}</style>
    </div>
  );
}

const FIELD = {
  width: '100%', padding: '10px 14px',
  background: '#080808', border: '1px solid #1e1e1e',
  borderRadius: 8, color: '#efefef', fontSize: 15,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'DM Sans', system-ui, sans-serif",
};
