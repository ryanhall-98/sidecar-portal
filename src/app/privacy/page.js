const C = { bg:'#0a0a0a', surface:'#141414', border:'#222', text:'#e8e8e8', textMuted:'#888', accent:'#6366f1' };
function S({ title, children }) { return <div style={{marginBottom:32}}><h2 style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:12}}>{title}</h2><div>{children}</div></div>; }
export default function PrivacyPage() { return (
<div style={{minHeight:'100vh',background:C.bg,padding:'80px 24px'}}><div style={{maxWidth:720,margin:'0 auto'}}>
<a href="https://sidecarhq.cc" style={{textDecoration:'none'}}><div style={{fontSize:20,fontWeight:700,color:C.accent,letterSpacing:3,fontFamily:"'Space Mono', monospace",marginBottom:48}}>SIDECAR</div></a>
<h1 style={{fontSize:36,fontWeight:700,color:C.text,marginBottom:8}}>Privacy Policy</h1>
<p style={{fontSize:14,color:C.textMuted,marginBottom:40}}>Effective Date: March 4, 2026</p>
<div style={{color:C.textMuted,fontSize:15,lineHeight:1.8}}>
<S title="1. Information We Collect">We collect information you provide directly: name, email address, phone number, bar/restaurant name and address, social media handles, and content you send via SMS or portal. We also collect usage data automatically: pages visited, features used, timestamps, device information, and IP address.</S>
<S title="2. How We Use Your Information">We use your information to provide, maintain, and improve the Service, generate and deliver content on your behalf, communicate with you about your account and tasks, and process payments. We do not sell your personal information. We do not use your data to train AI models.</S>
<S title="3. SMS Communications">By providing your phone number and agreeing to our Terms of Service, you consent to receiving SMS messages from Sidecar related to the Service. Messages include task confirmations, completed deliverables, and service notifications. Message frequency varies based on your usage. You may opt out at any time by texting STOP to our number. Standard carrier message and data rates may apply.</S>
<S title="4. Third-Party Service Providers">We share your information only with service providers necessary to operate Sidecar: Twilio (SMS messaging), Anthropic (AI processing), Supabase (database and authentication), Stripe (payment processing), Vercel (hosting), and Resend (email). Each provider is bound by their own privacy policies.</S>
<S title="5. AI Processing">Your messages and business data are processed by large language models to generate responses and content. This processing occurs in real-time and is not stored by the AI provider beyond the immediate request. We do not use your data to train, fine-tune, or improve any AI models.</S>
<S title="6. Data Security">We implement industry-standard security measures including HTTPS encryption, encrypted storage of sensitive credentials, row-level security policies in our database, and regular security reviews.</S>
<S title="7. Data Retention">We retain your data for the duration of your active subscription. Upon cancellation, your data is deleted within 30 days. You may request immediate deletion at any time by contacting us.</S>
<S title="8. Your Rights">You have the right to access, correct, or delete your personal information, request a copy of your data, opt out of marketing communications, and request restriction of processing.</S>
<S title="9. California Residents (CCPA)">California residents have additional rights including the right to know what personal information is collected, the right to request deletion, the right to opt out of the sale of personal information (we do not sell your data), and the right to non-discrimination.</S>
<S title="10. Contact">Questions about this Privacy Policy? Contact us at <a href="mailto:hello@sidecarhq.cc" style={{color:C.accent}}>hello@sidecarhq.cc</a>.</S>
</div>
<div style={{borderTop:`1px solid ${C.border}`,marginTop:48,paddingTop:24}}><div style={{display:'flex',gap:24,fontSize:13}}><a href="/terms" style={{color:C.textMuted,textDecoration:'none'}}>Terms of Service</a><a href="/" style={{color:C.textMuted,textDecoration:'none'}}>Portal</a><a href="https://sidecarhq.cc" style={{color:C.textMuted,textDecoration:'none'}}>Home</a></div></div>
</div></div>); }
