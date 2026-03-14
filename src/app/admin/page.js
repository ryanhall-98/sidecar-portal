'use client';
import { useState, useEffect, useCallback } from 'react';

const C = {
  bg:         '#080808',
  surface:    '#0f0f0f',
  surfaceUp:  '#141414',
  surfaceHi:  '#1a1a1a',
  border:     '#1c1c1c',
  borderHi:   '#252525',
  text:       '#f0f0f0',
  textMid:    '#686868',
  textDim:    '#333',
  accent:     '#6366f1',
  accentLo:   '#1a1935',
  accentHi:   '#818cf8',
  green:      '#22c55e',
  greenLo:    '#0a1f12',
  amber:      '#f59e0b',
  amberLo:    '#1f1508',
  red:        '#ef4444',
  redLo:      '#1f0a0a',
  blue:       '#38bdf8',
  blueLo:     '#0a1a2f',
  mono:       "'Space Mono', monospace",
  sans:       "'DM Sans', system-ui, sans-serif",
};

const BOT = 'https://railway-up-production-f5a0.up.railway.app';
const ADMIN_KEY = 'sidecar-admin-2026';

const TIER_META = {
  trial:         { label: 'Trial',         color: C.amber,  bg: C.amberLo,  price: 0    },
  the_well:      { label: 'The Well',      color: C.accent, bg: C.accentLo, price: 500  },
  the_double:    { label: 'The Double',    color: C.blue,   bg: C.blueLo,   price: 1500 },
  the_full_pour: { label: 'Full Pour',     color: C.green,  bg: C.greenLo,  price: 2500 },
  churned:       { label: 'Churned',       color: C.red,    bg: C.redLo,    price: 0    },
};

const CAT_COLORS = {
  social:   { text: '#a78bfa', bg: '#1a1535' },
  ordering: { text: '#34d399', bg: '#0a1f14' },
  reviews:  { text: '#60a5fa', bg: '#0a1525' },
  hiring:   { text: '#f472b6', bg: '#25101e' },
  events:   { text: '#fb923c', bg: '#221408' },
  image:    { text: '#e879f9', bg: '#1f0a24' },
  general:  { text: C.textMid, bg: C.surface },
};

const URG_META = {
  urgent: { color: C.red,   bg: C.redLo,   label: '🚨 Urgent' },
  high:   { color: C.amber, bg: C.amberLo, label: '⚡ High'   },
  normal: { color: C.textMid, bg: C.surface, label: 'Normal'  },
  low:    { color: C.textDim, bg: C.surface, label: 'Low'     },
};

function relTime(iso) {
  if (!iso) return '—';
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Pill({ label, color, bg, size = 11 }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: bg, color, fontSize: size, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: C.mono,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function Dot({ color }) {
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

function StatCard({ label, value, color = C.text, sub }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: C.mono, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textMid, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onAuth }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState(false);

  const attempt = () => {
    if (key === ADMIN_KEY) onAuth();
    else { setErr(true); setTimeout(() => setErr(false), 1200); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: C.sans,
    }}>
      <div style={{ width: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: '0.15em', fontFamily: C.mono, marginBottom: 4 }}>SIDECAR</div>
        <div style={{ fontSize: 12, color: C.textMid, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 36 }}>Admin Dashboard</div>
        <div style={{
          background: C.surface, border: `1px solid ${err ? C.red : C.border}`,
          borderRadius: 14, padding: 28, transition: 'border-color 0.2s',
        }}>
          <input
            type="password" value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            placeholder="Admin key"
            style={{
              width: '100%', padding: '12px 16px', background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 8,
              color: C.text, fontSize: 15, outline: 'none',
              boxSizing: 'border-box', fontFamily: C.sans, marginBottom: 14,
            }}
          />
          <button onClick={attempt} style={{
            width: '100%', padding: '13px 0', background: C.accent,
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: C.sans,
          }}>Enter</button>
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────
function OverviewTab({ customers, tasks, leads, botStatus, onRunApprovals, onRefresh, loading }) {
  const activeCust = customers.filter(c => c.subscription_tier && !['trial','churned'].includes(c.subscription_tier));
  const trialCust  = customers.filter(c => !c.subscription_tier || c.subscription_tier === 'trial');
  const churnedCust = customers.filter(c => c.subscription_tier === 'churned');
  const mrr = activeCust.reduce((s, c) => s + (TIER_META[c.subscription_tier]?.price || 0), 0);
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const unconverted  = leads.filter(l => !l.converted_at);

  const urgentTasks = pendingTasks.filter(t => t.urgency === 'urgent' || t.urgency === 'high');

  return (
    <div>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="MRR" value={`$${mrr.toLocaleString()}`} color={C.green} sub={`${activeCust.length} paying`} />
        <StatCard label="Customers" value={customers.length} color={C.text} sub={`${trialCust.length} trial · ${churnedCust.length} churned`} />
        <StatCard label="Pending Tasks" value={pendingTasks.length} color={pendingTasks.length > 0 ? C.amber : C.green} sub={urgentTasks.length > 0 ? `${urgentTasks.length} urgent/high` : 'All clear'} />
        <StatCard label="Leads" value={unconverted.length} color={C.blue} sub="awaiting conversion" />
        <StatCard label="Bot Uptime" value={botStatus?.uptime?.split(' ')[0] || '—'} color={C.textMid} sub={botStatus ? 'Online' : 'Offline'} />
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onRunApprovals} style={{
          padding: '9px 18px', background: C.greenLo, color: C.green,
          border: `1px solid ${C.green}33`, borderRadius: 8,
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.sans,
        }}>▶ Run Approvals</button>
        <button onClick={onRefresh} style={{
          padding: '9px 18px', background: C.surfaceHi, color: C.textMid,
          border: `1px solid ${C.border}`, borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.sans,
        }}>{loading ? 'Refreshing...' : '↻ Refresh'}</button>
      </div>

      {/* Urgent tasks */}
      {urgentTasks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.red, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            🚨 Needs Attention ({urgentTasks.length})
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {urgentTasks.map(t => (
              <TaskRow key={t.id} task={t} compact />
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Recent Tasks
        </div>
        {tasks.slice(0, 12).map((t, i) => (
          <TaskRow key={t.id} task={t} compact borderBottom={i < Math.min(tasks.length, 12) - 1} />
        ))}
        {tasks.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textMid, fontSize: 14 }}>No tasks yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── TASK ROW ─────────────────────────────────────────────────
function TaskRow({ task: t, compact, borderBottom = false, onMarkDone }) {
  const cat  = CAT_COLORS[t.category] || CAT_COLORS.general;
  const urg  = URG_META[t.urgency] || URG_META.normal;
  const statusColor = { pending: C.amber, done: C.green, approved: C.green, rejected: C.red }[t.status] || C.textMid;

  return (
    <div style={{
      padding: compact ? '12px 20px' : '16px 20px',
      borderBottom: borderBottom ? `1px solid ${C.border}` : 'none',
      display: 'flex', alignItems: compact ? 'center' : 'flex-start',
      gap: 12, background: C.surface,
    }}>
      <Dot color={statusColor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4, marginBottom: 5,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t.full_message || t.summary || '—'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Pill label={t.category || 'general'} color={cat.text} bg={cat.bg} />
          {t.urgency && t.urgency !== 'normal' && (
            <Pill label={t.urgency} color={urg.color} bg={urg.bg} />
          )}
          <span style={{ fontSize: 11, color: C.textMid }}>{t.phone}</span>
          <span style={{ fontSize: 11, color: C.textDim }}>{relTime(t.created_at)}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, fontFamily: C.mono, textTransform: 'uppercase', flexShrink: 0 }}>
        {t.status}
      </span>
    </div>
  );
}

// ─── CUSTOMERS TAB ────────────────────────────────────────────
function CustomersTab({ customers }) {
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');

  const filtered = customers.filter(c => {
    const matchSearch = !search || [c.bar_name, c.contact_name, c.email, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchTier = filterTier === 'all' || (c.subscription_tier || 'trial') === filterTier;
    return matchSearch && matchTier;
  });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          style={{
            flex: 1, minWidth: 180, padding: '9px 14px',
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, color: C.text, fontSize: 13,
            outline: 'none', fontFamily: C.sans,
          }}
        />
        {['all', 'trial', 'the_well', 'the_double', 'the_full_pour', 'churned'].map(tier => (
          <button key={tier} onClick={() => setFilterTier(tier)} style={{
            padding: '8px 14px',
            background: filterTier === tier ? C.accentLo : C.surface,
            color: filterTier === tier ? C.accentHi : C.textMid,
            border: `1px solid ${filterTier === tier ? C.accent + '44' : C.border}`,
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.sans,
          }}>
            {tier === 'all' ? 'All' : TIER_META[tier]?.label || tier}
          </button>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Customers</span>
          <span style={{ fontSize: 12, color: C.textMid }}>{filtered.length} shown</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textMid }}>No customers found.</div>
        ) : filtered.map((c, i) => {
          const tier = TIER_META[c.subscription_tier || 'trial'] || TIER_META.trial;
          return (
            <div key={c.id} style={{
              padding: '14px 20px',
              borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: C.accentLo, border: `1px solid ${C.accent}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: C.accentHi, flexShrink: 0,
              }}>
                {(c.bar_name || c.contact_name || '?')[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                  {c.bar_name || 'Unnamed Bar'}
                  {c.onboarding_complete &&
                    <span style={{ marginLeft: 8, fontSize: 10, color: C.green, fontWeight: 600 }}>✓ Onboarded</span>
                  }
                </div>
                <div style={{ fontSize: 12, color: C.textMid, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.contact_name && <span>{c.contact_name}</span>}
                  {c.phone && <span>{c.phone}</span>}
                  {c.neighborhood && <span>📍 {c.neighborhood}</span>}
                </div>
              </div>

              {/* Right */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <Pill label={tier.label} color={tier.color} bg={tier.bg} />
                <span style={{ fontSize: 11, color: C.textDim }}>{relTime(c.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TASKS TAB ────────────────────────────────────────────────
function TasksTab({ tasks, onMarkDone }) {
  const [filter, setFilter] = useState('pending');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = tasks.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchCat = catFilter === 'all' || t.category === catFilter;
    return matchStatus && matchCat;
  });

  const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'pending', 'done'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '8px 14px',
            background: filter === s ? C.accentLo : C.surface,
            color: filter === s ? C.accentHi : C.textMid,
            border: `1px solid ${filter === s ? C.accent + '44' : C.border}`,
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.sans,
            textTransform: 'capitalize',
          }}>{s}</button>
        ))}
        <div style={{ width: 1, background: C.border, margin: '0 4px' }} />
        <button onClick={() => setCatFilter('all')} style={{
          padding: '8px 14px',
          background: catFilter === 'all' ? C.surfaceHi : C.surface,
          color: C.textMid, border: `1px solid ${C.border}`,
          borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.sans,
        }}>All Categories</button>
        {cats.map(cat => {
          const c = CAT_COLORS[cat] || CAT_COLORS.general;
          return (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{
              padding: '8px 14px',
              background: catFilter === cat ? c.bg : C.surface,
              color: catFilter === cat ? c.text : C.textMid,
              border: `1px solid ${catFilter === cat ? c.text + '44' : C.border}`,
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.sans,
            }}>{cat}</button>
          );
        })}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tasks</span>
          <span style={{ fontSize: 12, color: C.textMid }}>{filtered.length} shown</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textMid }}>No tasks.</div>
        ) : filtered.slice(0, 50).map((t, i) => (
          <div key={t.id} style={{
            padding: '14px 20px',
            borderBottom: i < filtered.slice(0, 50).length - 1 ? `1px solid ${C.border}` : 'none',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <Dot color={{ pending: C.amber, done: C.green, rejected: C.red }[t.status] || C.textMid} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C.text, marginBottom: 6, lineHeight: 1.4 }}>
                {t.full_message || t.summary || '—'}
              </div>
              {t.bot_response && (
                <div style={{ fontSize: 12, color: C.textMid, marginBottom: 6, padding: '8px 12px', background: C.bg, borderRadius: 6, borderLeft: `2px solid ${C.border}` }}>
                  {t.bot_response.substring(0, 150)}{t.bot_response.length > 150 ? '...' : ''}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Pill label={t.category || 'general'} color={(CAT_COLORS[t.category] || CAT_COLORS.general).text} bg={(CAT_COLORS[t.category] || CAT_COLORS.general).bg} />
                {t.urgency && t.urgency !== 'normal' && (
                  <Pill label={t.urgency} color={(URG_META[t.urgency] || URG_META.normal).color} bg={(URG_META[t.urgency] || URG_META.normal).bg} />
                )}
                <span style={{ fontSize: 11, color: C.textMid }}>{t.phone}</span>
                <span style={{ fontSize: 11, color: C.textDim }}>{relTime(t.created_at)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {t.status === 'pending' && onMarkDone && (
                <button onClick={() => onMarkDone(t.id)} style={{
                  padding: '5px 12px', background: C.greenLo, color: C.green,
                  border: `1px solid ${C.green}33`, borderRadius: 6,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: C.sans,
                }}>Done</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LEADS TAB ────────────────────────────────────────────────
function LeadsTab({ leads }) {
  const unconverted = leads.filter(l => !l.converted_at).sort((a, b) => new Date(b.welcomed_at) - new Date(a.welcomed_at));
  const converted   = leads.filter(l => l.converted_at);

  const followupStatus = (l) => {
    if (l.followup_90d_sent) return { label: '90d sent', color: C.textDim };
    if (l.followup_30d_sent) return { label: '30d sent', color: C.textMid };
    if (l.followup_7d_sent)  return { label: '7d sent',  color: C.amber };
    if (l.followup_1d_sent)  return { label: '1d sent',  color: C.blue };
    return { label: 'Welcome sent', color: C.green };
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <StatCard label="Unconverted Leads" value={unconverted.length} color={C.blue} />
        <StatCard label="Converted" value={converted.length} color={C.green} sub="all time" />
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Lead Pipeline ({unconverted.length})
          </span>
        </div>
        {unconverted.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textMid }}>No unconverted leads.</div>
        ) : unconverted.map((l, i) => {
          const fu = followupStatus(l);
          const daysSince = Math.floor((Date.now() - new Date(l.welcomed_at)) / 86400000);
          return (
            <div key={l.id || l.phone} style={{
              padding: '14px 20px',
              borderBottom: i < unconverted.length - 1 ? `1px solid ${C.border}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: C.blueLo, border: `1px solid ${C.blue}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: C.blue, flexShrink: 0, fontFamily: C.mono,
              }}>
                {daysSince}d
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, marginBottom: 3, fontFamily: C.mono }}>{l.phone}</div>
                <div style={{ fontSize: 11, color: C.textMid }}>
                  Welcomed {relTime(l.welcomed_at)}
                </div>
              </div>
              <Pill label={fu.label} color={fu.color} bg={C.surface} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOGS TAB ─────────────────────────────────────────────────
function LogsTab({ logs, onRefresh, loading }) {
  const [filter, setFilter] = useState('all');

  const logColor = (action) => {
    if (action.includes('error')) return C.red;
    if (action.includes('sms') || action.includes('mms')) return C.blue;
    if (action.includes('airtable')) return C.green;
    if (action.includes('image')) return '#e879f9';
    if (action.includes('onboard')) return C.amber;
    if (action.includes('approval')) return C.accentHi;
    return C.accent;
  };

  const categories = [...new Set(logs.map(l => {
    if (l.action.includes('error')) return 'errors';
    if (l.action.includes('sms') || l.action.includes('mms')) return 'sms';
    if (l.action.includes('image')) return 'images';
    if (l.action.includes('airtable')) return 'airtable';
    return 'other';
  }))];

  const filtered = filter === 'all' ? logs : logs.filter(l => {
    if (filter === 'errors') return l.action.includes('error');
    if (filter === 'sms') return l.action.includes('sms') || l.action.includes('mms');
    if (filter === 'images') return l.action.includes('image');
    if (filter === 'airtable') return l.action.includes('airtable');
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'errors', 'sms', 'images', 'airtable'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px',
            background: filter === f ? C.accentLo : C.surface,
            color: filter === f ? C.accentHi : C.textMid,
            border: `1px solid ${filter === f ? C.accent + '44' : C.border}`,
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.sans,
          }}>{f}</button>
        ))}
        <button onClick={onRefresh} style={{
          marginLeft: 'auto', padding: '7px 14px',
          background: C.surface, color: C.textMid,
          border: `1px solid ${C.border}`, borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.sans,
        }}>{loading ? '...' : '↻'}</button>
      </div>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ maxHeight: 560, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textMid }}>No logs.</div>
          ) : filtered.slice(0, 100).map((l, i) => (
            <div key={i} style={{
              padding: '8px 16px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', gap: 12, alignItems: 'baseline',
              fontFamily: C.mono, fontSize: 12,
              background: l.action.includes('error') ? `${C.redLo}88` : 'transparent',
            }}>
              <span style={{ color: C.textDim, flexShrink: 0, fontSize: 11 }}>
                {new Date(l.time).toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span style={{ color: logColor(l.action), flexShrink: 0, minWidth: 120 }}>
                [{l.action}]
              </span>
              <span style={{ color: C.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [tab, setTab]           = useState('overview');
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [leads, setLeads]       = useState([]);
  const [logs, setLogs]         = useState([]);
  const [botStatus, setBotStatus] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, color = C.green) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, tasksRes, logsRes] = await Promise.all([
        fetch(`${BOT}/`).then(r => r.json()).catch(() => null),
        fetch(`${BOT}/api/tasks`).then(r => r.json()).catch(() => []),
        fetch(`${BOT}/logs`).then(r => r.json()).catch(() => []),
      ]);

      if (statusRes) setBotStatus(statusRes);
      if (Array.isArray(tasksRes)) setTasks(tasksRes);
      if (Array.isArray(logsRes)) setLogs([...logsRes].reverse());

      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const [{ data: custs }, { data: ldss }] = await Promise.all([
        sb.from('customers').select('*').order('created_at', { ascending: false }),
        sb.from('contacts').select('*').order('welcomed_at', { ascending: false }),
      ]);
      if (custs) setCustomers(custs);
      if (ldss) setLeads(ldss);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadData();
    const iv = setInterval(loadData, 30000);
    return () => clearInterval(iv);
  }, [authed, loadData]);

  const runApprovals = async () => {
    try {
      const r = await fetch(`${BOT}/api/poll-approvals?key=sidecar-secret`);
      const d = await r.json();
      showToast(`✓ Processed ${d.processed} tasks`);
      loadData();
    } catch (e) { showToast(`Error: ${e.message}`, C.red); }
  };

  const markDone = async (id) => {
    try {
      await fetch(`${BOT}/api/tasks/${id}/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      });
      showToast('✓ Task marked done');
      loadData();
    } catch (e) { showToast(`Error: ${e.message}`, C.red); }
  };

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;

  const TABS = [
    { id: 'overview',   label: 'Overview'   },
    { id: 'customers',  label: 'Customers'  },
    { id: 'tasks',      label: 'Tasks'      },
    { id: 'leads',      label: 'Leads'      },
    { id: 'logs',       label: 'Logs'       },
  ];

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const activeCust = customers.filter(c => c.subscription_tier && !['trial','churned'].includes(c.subscription_tier));
  const mrr = activeCust.reduce((s, c) => s + (TIER_META[c.subscription_tier]?.price || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.sans, color: C.text }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          padding: '12px 20px', borderRadius: 10,
          background: toast.color === C.green ? C.greenLo : C.redLo,
          color: toast.color, border: `1px solid ${toast.color}33`,
          fontSize: 14, fontWeight: 600, fontFamily: C.sans,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{
        height: 52, background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 20,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, letterSpacing: '0.12em', fontFamily: C.mono }}>
          SIDECAR
        </div>
        <div style={{ fontSize: 11, color: C.textMid, fontFamily: C.mono }}>ADMIN</div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 16, marginLeft: 16 }}>
          <span style={{ fontSize: 13, color: C.green, fontFamily: C.mono, fontWeight: 700 }}>
            ${mrr.toLocaleString()} MRR
          </span>
          {pendingCount > 0 && (
            <span style={{ fontSize: 13, color: C.amber, fontFamily: C.mono }}>
              {pendingCount} pending
            </span>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {botStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: C.textMid }}>Bot online · {botStatus.uptime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: 2,
        padding: '0 24px',
        borderBottom: `1px solid ${C.border}`,
        background: C.bg,
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '13px 18px',
            background: 'transparent',
            color: tab === t.id ? C.accentHi : C.textMid,
            borderBottom: `2px solid ${tab === t.id ? C.accent : 'transparent'}`,
            border: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            fontFamily: C.sans, whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}>
            {t.label}
            {t.id === 'tasks' && pendingCount > 0 && (
              <span style={{
                marginLeft: 6, padding: '1px 6px', borderRadius: 10,
                background: C.amberLo, color: C.amber, fontSize: 10, fontWeight: 700,
              }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
        {tab === 'overview'  && <OverviewTab customers={customers} tasks={tasks} leads={leads} botStatus={botStatus} onRunApprovals={runApprovals} onRefresh={loadData} loading={loading} />}
        {tab === 'customers' && <CustomersTab customers={customers} />}
        {tab === 'tasks'     && <TasksTab tasks={tasks} onMarkDone={markDone} />}
        {tab === 'leads'     && <LeadsTab leads={leads} />}
        {tab === 'logs'      && <LogsTab logs={logs} onRefresh={loadData} loading={loading} />}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        input, button, textarea { font-family: ${C.sans}; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.borderHi}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
