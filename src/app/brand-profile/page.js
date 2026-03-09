'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================
// COLORS (matches portal design system)
// ============================================================
const C = {
  bg: '#0a0a0a', surface: '#141414', surfaceHover: '#1a1a1a',
  border: '#222', borderLight: '#333',
  text: '#e8e8e8', textMuted: '#888', textDim: '#555',
  accent: '#6366f1', accentHover: '#818cf8', accentDim: '#312e81',
  green: '#22c55e', greenDim: '#14532d',
  red: '#ef4444', redDim: '#7f1d1d',
  blue: '#3b82f6',
};

const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://railway-up-production-f5a0.up.railway.app';

// ============================================================
// STYLES
// ============================================================
const inputStyle = {
  width: '100%', padding: '14px 16px', background: C.bg,
  border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
  fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 80 };
const labelStyle = {
  display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
};

// ============================================================
// DATA
// ============================================================
const STEPS = ['Basics', 'Vibe & Tone', 'Visual Style', 'Content Rules', 'Review'];

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional', desc: 'Clean, polished, corporate-friendly', emoji: '🏢' },
  { id: 'playful', label: 'Playful', desc: 'Fun, witty, doesn\'t take itself seriously', emoji: '🎉' },
  { id: 'edgy', label: 'Edgy', desc: 'Bold, provocative, pushes boundaries', emoji: '🔥' },
  { id: 'sophisticated', label: 'Sophisticated', desc: 'Upscale, refined, curated experience', emoji: '🥂' },
  { id: 'casual', label: 'Casual', desc: 'Laid back, neighborhood joint, come-as-you-are', emoji: '🍺' },
  { id: 'nostalgic', label: 'Nostalgic', desc: 'Vintage vibes, throwback energy, old-school cool', emoji: '📻' },
];

const VISUAL_OPTIONS = [
  { id: 'dark_moody', label: 'Dark & Moody', color: '#1a1a2e' },
  { id: 'bright_clean', label: 'Bright & Clean', color: '#f0f4f8' },
  { id: 'warm_rustic', label: 'Warm & Rustic', color: '#8B4513' },
  { id: 'neon_nightlife', label: 'Neon Nightlife', color: '#e94560' },
  { id: 'vintage_retro', label: 'Vintage Retro', color: '#d4a373' },
  { id: 'minimal_modern', label: 'Minimal Modern', color: '#2d3436' },
];

const POST_FREQ = ['2x/week', '3x/week', '4x/week', '5x/week', 'Daily'];
const CONTENT_TYPES = [
  'Cocktail features', 'Food specials', 'Event promos', 'Behind the bar',
  'Staff spotlights', 'Customer shoutouts', 'Industry news', 'Seasonal content',
  'Happy hour promos', 'Memes/humor', 'Repost UGC', 'Neighborhood vibes',
];

const DELIVERY_OPTIONS = [
  { id: 'text', label: 'Text Me the Content', desc: 'Sidecar texts you the caption + image. You copy/paste and post.' },
  { id: 'direct', label: 'Post Directly for Me', desc: 'Sidecar posts to your Instagram via Meta Business Suite.' },
];

const EMPTY_PROFILE = {
  bar_name: '', owner_name: '', neighborhood: '', bar_type: '',
  signature_drinks: '', target_demo: '', competitors: '',
  tone: [], brand_story: '',
  visual_style: '', caption_length: 'medium',
  use_emojis: true, use_hashtags: true, hashtag_style: 'branded',
  custom_hashtags: '', post_frequency: '3x/week', content_types: [],
  do_not: '', always_include: '', delivery_method: 'text', instagram_handle: '',
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BrandProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [existingProfile, setExistingProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/'; return; }
      setUser(data.user);
      loadProfile(data.user.id);
    });
  }, []);

  // Load existing profile
  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setProfile({
        bar_name: data.bar_name || '',
        owner_name: data.owner_name || '',
        neighborhood: data.neighborhood || '',
        bar_type: data.bar_type || '',
        signature_drinks: data.signature_drinks || '',
        target_demo: data.target_demo || '',
        competitors: data.competitors || '',
        tone: data.tone || [],
        brand_story: data.brand_story || '',
        visual_style: data.visual_style || '',
        caption_length: data.caption_length || 'medium',
        use_emojis: data.use_emojis !== false,
        use_hashtags: data.use_hashtags !== false,
        hashtag_style: data.hashtag_style || 'branded',
        custom_hashtags: data.custom_hashtags || '',
        post_frequency: data.post_frequency || '3x/week',
        content_types: data.content_types || [],
        do_not: data.do_not || '',
        always_include: data.always_include || '',
        delivery_method: data.delivery_method || 'text',
        instagram_handle: data.instagram_handle || '',
      });
      setExistingProfile(data);
    }

    // Pre-fill bar name from customers table if no profile exists
    if (!data) {
      const { data: customer } = await supabase
        .from('customers')
        .select('bar_name, contact_name, address, bar_type, instagram_handle')
        .eq('user_id', userId)
        .single();
      if (customer) {
        setProfile(p => ({
          ...p,
          bar_name: customer.bar_name || '',
          owner_name: customer.contact_name || '',
          bar_type: customer.bar_type || '',
          instagram_handle: customer.instagram_handle || '',
        }));
      }
    }

    setLoading(false);
  };

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const profileData = { ...profile, user_id: user.id };

      if (existingProfile) {
        const { error: err } = await supabase
          .from('brand_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('brand_profiles')
          .insert(profileData);
        if (err) throw err;
      }

      // Sync to Airtable via bot API
      try {
        await fetch(`${BOT_URL}/api/sync-brand-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            profile: profileData,
          }),
        });
      } catch (e) {
        // Airtable sync is best-effort — don't block save
        console.warn('Airtable sync failed:', e);
      }

      setSaved(true);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    }

    setSaving(false);
  };

  const update = (field, value) => setProfile(p => ({ ...p, [field]: value }));
  const toggleArray = (field, value) => {
    setProfile(p => ({
      ...p,
      [field]: p[field].includes(value)
        ? p[field].filter(v => v !== value)
        : [...p[field], value],
    }));
  };

  const canProceed = () => {
    if (step === 0) return profile.bar_name && profile.owner_name;
    if (step === 1) return profile.tone.length > 0;
    if (step === 2) return profile.visual_style;
    if (step === 3) return profile.content_types.length > 0;
    return true;
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: 15 }}>Loading...</div>
      </div>
    );
  }

  // Saved state
  if (saved) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
            Brand Profile {existingProfile ? 'Updated' : 'Saved'}
          </h1>
          <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.6, marginBottom: 32 }}>
            {profile.bar_name}&apos;s brand voice is locked in. Every piece of content Sidecar generates will follow these guidelines.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/" style={{
              display: 'inline-block', padding: '14px 28px', background: C.accent,
              color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none',
            }}>Back to Portal</a>
            <button onClick={() => { setSaved(false); setStep(0); }} style={{
              padding: '14px 28px', background: C.surface, color: C.textMuted,
              border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>Edit Profile</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // WIZARD
  // ============================================================
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '40px 20px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, letterSpacing: 3, fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
              SIDECAR
            </div>
          </a>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>
            {existingProfile ? 'Edit' : 'Set Up'} Brand Voice Profile
          </h1>
          <p style={{ fontSize: 14, color: C.textDim, margin: 0 }}>
            This shapes every caption, review response, and post we create for {profile.bar_name || 'your bar'}.
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{
                height: 4, borderRadius: 2, marginBottom: 6,
                background: i <= step ? C.accent : C.border,
                transition: 'background 0.3s',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: i <= step ? C.accent : C.textDim,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 32 }}>

          {/* ---- STEP 0: Basics ---- */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Tell us about the bar</h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '0 0 24px' }}>The more detail, the better the content.</p>
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { label: 'Bar Name', field: 'bar_name', placeholder: 'Death & Co' },
                  { label: 'Owner / Manager Name', field: 'owner_name', placeholder: 'Maria' },
                  { label: 'Neighborhood', field: 'neighborhood', placeholder: 'East Village' },
                  { label: 'Type of Bar', field: 'bar_type', placeholder: 'Craft cocktail bar, dive bar, wine bar...' },
                  { label: 'Signature Drinks / Menu Highlights', field: 'signature_drinks', placeholder: 'Oaxaca Old Fashioned, house negroni...' },
                  { label: 'Target Customer', field: 'target_demo', placeholder: 'Young professionals, date night crowd...' },
                  { label: 'Competitors / Nearby Bars', field: 'competitors', placeholder: 'Attaboy, Please Don\'t Tell...' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type="text" value={profile[field]}
                      onChange={e => update(field, e.target.value)}
                      placeholder={placeholder} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = C.accent}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- STEP 1: Vibe & Tone ---- */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>What&apos;s the vibe?</h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '0 0 24px' }}>Pick 1–3 that match how your bar talks to its audience.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TONE_OPTIONS.map(opt => {
                  const selected = profile.tone.includes(opt.id);
                  return (
                    <div key={opt.id} onClick={() => toggleArray('tone', opt.id)} style={{
                      padding: 16, borderRadius: 12, cursor: 'pointer',
                      background: selected ? C.accentDim : C.bg,
                      border: `1px solid ${selected ? C.accent : C.border}`,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.emoji}</div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{opt.label}</div>
                      <div style={{ color: C.textDim, fontSize: 12, lineHeight: 1.4 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20 }}>
                <label style={labelStyle}>Brand Story (Optional)</label>
                <textarea
                  value={profile.brand_story} onChange={e => update('brand_story', e.target.value)}
                  placeholder="Any backstory or personality notes that should come through in content..."
                  rows={3} style={textareaStyle}
                />
              </div>
            </div>
          )}

          {/* ---- STEP 2: Visual Style ---- */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Visual Style</h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '0 0 24px' }}>Guides the aesthetic of photos and content themes.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {VISUAL_OPTIONS.map(opt => {
                  const selected = profile.visual_style === opt.id;
                  return (
                    <div key={opt.id} onClick={() => update('visual_style', opt.id)} style={{
                      padding: '18px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      background: selected ? C.accentDim : C.bg,
                      border: `1px solid ${selected ? C.accent : C.border}`,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: opt.color,
                        margin: '0 auto 8px', border: `2px solid ${C.borderLight}`,
                      }} />
                      <div style={{ color: C.text, fontWeight: 600, fontSize: 12 }}>{opt.label}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24 }}>
                <label style={labelStyle}>Caption Length</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['short', 'medium', 'long'].map(len => (
                    <button key={len} onClick={() => update('caption_length', len)} style={{
                      flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                      background: profile.caption_length === len ? C.accentDim : C.bg,
                      border: `1px solid ${profile.caption_length === len ? C.accent : C.border}`,
                      color: profile.caption_length === len ? C.accent : C.textMuted,
                      fontSize: 13, fontWeight: 600, textTransform: 'capitalize', fontFamily: 'inherit',
                    }}>{len}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 24 }}>
                {[
                  { label: 'Use Emojis', field: 'use_emojis' },
                  { label: 'Use Hashtags', field: 'use_hashtags' },
                ].map(({ label, field }) => (
                  <label key={field} onClick={() => update(field, !profile[field])} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: C.textMuted, fontSize: 14, cursor: 'pointer',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      background: profile[field] ? C.accent : C.bg,
                      border: `1px solid ${profile[field] ? C.accent : C.border}`,
                      color: '#fff',
                    }}>{profile[field] ? '✓' : ''}</div>
                    {label}
                  </label>
                ))}
              </div>

              {profile.use_hashtags && (
                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>Custom Hashtags</label>
                  <input type="text" value={profile.custom_hashtags}
                    onChange={e => update('custom_hashtags', e.target.value)}
                    placeholder="#yourbar, #eastvillage, #craftcocktails"
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <label style={labelStyle}>Instagram Handle</label>
                <input type="text" value={profile.instagram_handle}
                  onChange={e => update('instagram_handle', e.target.value)}
                  placeholder="@yourbar" style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* ---- STEP 3: Content Rules ---- */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Content Rules</h2>
              <p style={{ fontSize: 13, color: C.textDim, margin: '0 0 24px' }}>What to post, how often, and how to deliver it.</p>

              <label style={labelStyle}>Post Frequency</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {POST_FREQ.map(freq => (
                  <button key={freq} onClick={() => update('post_frequency', freq)} style={{
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    background: profile.post_frequency === freq ? C.accentDim : C.bg,
                    border: `1px solid ${profile.post_frequency === freq ? C.accent : C.border}`,
                    color: profile.post_frequency === freq ? C.accent : C.textMuted,
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  }}>{freq}</button>
                ))}
              </div>

              <label style={labelStyle}>Content Types</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {CONTENT_TYPES.map(type => {
                  const selected = profile.content_types.includes(type);
                  return (
                    <button key={type} onClick={() => toggleArray('content_types', type)} style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                      background: selected ? C.accentDim : C.bg,
                      border: `1px solid ${selected ? C.accent : C.border}`,
                      color: selected ? C.accent : C.textMuted,
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    }}>{type}</button>
                  );
                })}
              </div>

              <label style={labelStyle}>How Should We Deliver Content?</label>
              <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                {DELIVERY_OPTIONS.map(opt => {
                  const selected = profile.delivery_method === opt.id;
                  return (
                    <div key={opt.id} onClick={() => update('delivery_method', opt.id)} style={{
                      padding: 16, borderRadius: 12, cursor: 'pointer',
                      background: selected ? C.accentDim : C.bg,
                      border: `1px solid ${selected ? C.accent : C.border}`,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{opt.label}</div>
                      <div style={{ color: C.textDim, fontSize: 12 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Never Do This (Guardrails)</label>
                  <textarea value={profile.do_not} onChange={e => update('do_not', e.target.value)}
                    placeholder="e.g., Never mention competitors by name, no political content..."
                    rows={2} style={textareaStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Always Include</label>
                  <textarea value={profile.always_include} onChange={e => update('always_include', e.target.value)}
                    placeholder="e.g., Always mention happy hour (4-7pm), always tag @yourbar..."
                    rows={2} style={textareaStyle} />
                </div>
              </div>
            </div>
          )}

          {/* ---- STEP 4: Review ---- */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 24px' }}>Review your profile</h2>
              {[
                { label: 'Bar', value: `${profile.bar_name}${profile.neighborhood ? ` — ${profile.neighborhood}` : ''}${profile.bar_type ? ` (${profile.bar_type})` : ''}` },
                { label: 'Owner', value: profile.owner_name },
                { label: 'Signature Drinks', value: profile.signature_drinks },
                { label: 'Target Customer', value: profile.target_demo },
                { label: 'Tone', value: profile.tone.join(', ') },
                { label: 'Visual Style', value: profile.visual_style?.replace(/_/g, ' ') },
                { label: 'Captions', value: `${profile.caption_length}${profile.use_emojis ? ', emojis' : ''}${profile.use_hashtags ? ', hashtags' : ''}` },
                { label: 'Frequency', value: profile.post_frequency },
                { label: 'Content', value: profile.content_types.join(', ') },
                { label: 'Delivery', value: profile.delivery_method === 'text' ? 'Text me the content' : 'Post directly for me' },
                { label: 'Guardrails', value: profile.do_not || 'None set' },
                { label: 'Always Include', value: profile.always_include || 'None set' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '12px 0', borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ color: C.textDim, fontSize: 12, fontWeight: 600, minWidth: 100, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{ color: C.text, fontSize: 14, textAlign: 'right', maxWidth: '65%' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: C.redDim, border: `1px solid ${C.red}`, borderRadius: 8, color: C.red, fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
            <button onClick={() => step === 0 ? window.location.href = '/' : setStep(s => s - 1)} style={{
              padding: '12px 24px', background: C.bg, color: C.textMuted,
              border: `1px solid ${C.border}`, borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>{step === 0 ? '← Portal' : 'Back'}</button>

            <button
              onClick={() => step === 4 ? handleSave() : setStep(s => s + 1)}
              disabled={!canProceed() || saving}
              style={{
                padding: '12px 28px',
                background: canProceed() ? C.accent : C.border,
                color: canProceed() ? '#fff' : C.textDim,
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                cursor: canProceed() ? 'pointer' : 'default',
                fontFamily: 'inherit',
                opacity: saving ? 0.6 : 1,
              }}
            >{step === 4 ? (saving ? 'Saving...' : (existingProfile ? 'Update Profile' : 'Save Profile')) : 'Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
