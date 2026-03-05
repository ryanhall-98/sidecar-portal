const C = { bg:'#0a0a0a', surface:'#141414', border:'#222', text:'#e8e8e8', textMuted:'#888', accent:'#6366f1' };
function S({ title, children }) { return <div style={{marginBottom:32}}><h2 style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:12}}>{title}</h2><div>{children}</div></div>; }
export default function TermsPage() { return (
<div style={{minHeight:'100vh',background:C.bg,padding:'80px 24px'}}><div style={{maxWidth:720,margin:'0 auto'}}>
<a href="https://sidecarhq.cc" style={{textDecoration:'none'}}><div style={{fontSize:20,fontWeight:700,color:C.accent,letterSpacing:3,fontFamily:"'Space Mono', monospace",marginBottom:48}}>SIDECAR</div></a>
<h1 style={{fontSize:36,fontWeight:700,color:C.text,marginBottom:8}}>Terms of Service</h1>
<p style={{fontSize:14,color:C.textMuted,marginBottom:40}}>Effective Date: March 4, 2026</p>
<div style={{color:C.textMuted,fontSize:15,lineHeight:1.8}}>
<S title="1. Agreement to Terms">By accessing or using Sidecar&apos;s services, including our SMS-based back office service, customer portal at portal.sidecarhq.cc, and any related tools, you agree to be bound by these Terms. If you do not agree, do not use the Service.</S>
<S title="2. Description of Service">Sidecar provides AI-assisted back office support for bars and restaurants via SMS, including review response management, social media content creation, vendor communication, hiring post creation, event promotion, and operational task management. Service scope varies by subscription tier.</S>
<S title="3. Eligibility">You must be at least 18 years old and have the authority to bind your business to these Terms.</S>
<S title="4. Account Registration">You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately of any unauthorized use at ryan@sidecarhq.cc.</S>
<S title="5. SMS Consent">By providing your phone number during registration, you expressly consent to receive SMS messages from Sidecar related to the Service. Messages may include task confirmations, deliverable notifications, and service updates. You may opt out at any time by texting STOP. Standard message and data rates may apply. Message frequency varies based on your usage.</S>
<S title="6. Subscription and Billing">Sidecar offers multiple subscription tiers. Pricing is subject to change with 30 days written notice. New customers receive a 7-day free trial. No credit card is required to begin. Subscription fees are billed monthly in advance via Stripe. All fees are in US Dollars and are non-refundable except as required by law. You may cancel at any time with 30 days written notice.</S>
<S title="7. Content and Intellectual Property">You retain ownership of all content you provide to Sidecar. You grant Sidecar a limited license to use your content solely to provide the Service. Content created by Sidecar on your behalf becomes your property upon delivery. You are responsible for reviewing and approving content before it is published. The Service itself remains the property of Sidecar HQ.</S>
<S title="8. AI Disclosure">Sidecar uses artificial intelligence to assist in generating content and processing requests. All AI-generated content is reviewed before delivery. We do not use your data to train AI models.</S>
<S title="9. Limitation of Liability">Sidecar&apos;s total liability shall not exceed the total fees paid by you in the 12 months preceding the claim. Sidecar shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</S>
<S title="10. Dispute Resolution">Any disputes shall be resolved through binding arbitration in New York City, NY. You agree to waive your right to participate in class action lawsuits.</S>
<S title="11. Contact">Questions? Contact us at <a href="mailto:ryan@sidecarhq.cc" style={{color:C.accent}}>ryan@sidecarhq.cc</a>.</S>
</div>
<div style={{borderTop:`1px solid ${C.border}`,marginTop:48,paddingTop:24}}><div style={{display:'flex',gap:24,fontSize:13}}><a href="/privacy" style={{color:C.textMuted,textDecoration:'none'}}>Privacy Policy</a><a href="/" style={{color:C.textMuted,textDecoration:'none'}}>Portal</a><a href="https://sidecarhq.cc" style={{color:C.textMuted,textDecoration:'none'}}>Home</a></div></div>
</div></div>); }
